# Deploy su Vercel

Alternativa a Netlify (vedi `DEPLOY.md`) — stesso database Neon, stesso codice,
cambia solo dove gira l'app. Vercel è la piattaforma di chi ha creato Next.js,
quindi il supporto è nativo al 100%.

## 1. Collegare il repository

1. [vercel.com](https://vercel.com) → accedi con GitHub.
2. **Add New → Project** → seleziona `magro58/FITNESS-COACH-PLATFORM`.
3. Framework Preset: **Next.js** (rilevato da solo). Build command e root
   directory: lascia i default.
4. **Non aggiungere** l'integrazione "Prisma Postgres" proposta da Vercel —
   è un database separato e vuoto, diverso dal tuo Neon già configurato.

## 2. Variabili d'ambiente

Nella stessa schermata di import (o dopo, in **Settings → Environment
Variables**):

| Chiave | Valore |
|---|---|
| `DATABASE_URL` | connection string **pooled** di Neon (host con `-pooler`) |
| `DIRECT_URL` | connection string **diretta** di Neon (host senza `-pooler`) |
| `AUTH_SECRET` | una stringa lunga e casuale |
| `NEXT_PUBLIC_APP_URL` | l'URL assegnato da Vercel, es. `https://tuoprogetto.vercel.app` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | stessi valori usati su Netlify, se attivi il login Google |

Su Vercel serve **la connessione pooled** in `DATABASE_URL` (non solo consigliata
come su Netlify): le funzioni serverless di Vercel possono partire in più
istanze concorrenti più facilmente, ed è più semplice esaurire le connessioni
dirette dirette che Neon accetta.

## 3. Storage dei file (foto profilo, media)

`src/lib/storage.ts` rileva automaticamente Vercel (`process.env.VERCEL`) e usa
[Vercel Blob](https://vercel.com/docs/vercel-blob) (store **privato**) invece
del filesystem locale — va però **collegato uno store Blob al progetto**:

1. Nel progetto su Vercel → tab **Storage** → **Create Database** → **Blob**.
2. **Access: Private** (opzione consigliata da Vercel stesso, lasciala
   selezionata) — richiede un token per leggere i file, esattamente come
   Netlify Blobs: nessun URL pubblico verso lo storage.
3. Lascia spuntato "Add a read-write token env var to this connection" —
   Vercel inietta da solo `BLOB_READ_WRITE_TOKEN` (oltre a `BLOB_STORE_ID` e
   `BLOB_WEBHOOK_PUBLIC_KEY`), non va copiato a mano.
4. Rideploy (basta un push, o "Redeploy" dalla dashboard) perché le variabili
   siano disponibili alle funzioni.

Con lo store privato, la garanzia di sicurezza resta identica a quella
descritta nel `README.md` ("nessun URL pubblico verso lo storage") — gli
endpoint autenticati dell'app (`/api/media/[id]/file`,
`/api/profile-photo/[userId]`) restano l'unico modo con cui client e browser
accedono ai file, e anche il file "grezzo" su Vercel Blob non è raggiungibile
senza il token del progetto, non solo per il percorso non indovinabile.

## 4. Notifiche realtime (SSE) — limite più stretto che su Netlify

Le funzioni serverless di Vercel (piano Hobby gratuito) terminano dopo **10
secondi** di esecuzione. L'endpoint `/api/realtime/stream` di questa app tiene
una connessione aperta più a lungo per il push istantaneo delle notifiche —
su Vercel verrebbe interrotta dopo 10 secondi invece di restare aperta.

Le notifiche restano comunque salvate nel database e visibili al prossimo
refresh/navigazione, esattamente come già succedeva su Netlify — solo che su
Vercel la disconnessione avviene più spesso (ogni 10s anziché quando cambia
istanza serverless). Se in futuro serve un aggiornamento istantaneo davvero
affidabile, la soluzione pulita è sostituire l'SSE con un polling lato client
ogni 15-30 secondi, o un servizio realtime esterno (Pusher, Ably, Supabase
Realtime) — nessuna delle due è stata implementata finché non serve davvero.

## 5. OAuth (se attivo)

Aggiungi il nuovo redirect URI accanto a quello di Netlify (non sostituirlo,
convivono) nella console di ciascun provider configurato:

```
https://<il-tuo-progetto>.vercel.app/api/oauth/callback/google
```

(sostituisci `google` con `microsoft-entra-id` o `apple` per gli altri
provider, se attivi — vedi `OAUTH_SETUP.md`).

## 6. Limiti del piano gratuito (Hobby)

- 100 GB di banda/mese — oltre, i nuovi deploy vengono messi in pausa fino al
  mese successivo (nessun addebito automatico).
- 100.000 invocazioni di funzioni/mese, max 10 secondi per invocazione (vedi
  punto 4 sopra).
- Uso **non commerciale** — se l'app inizia a generare un pagamento diretto
  (non tramite Play Store/App Store), serve il piano Pro ($20/mese).

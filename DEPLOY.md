# Guida al deploy online (Netlify)

Questa app **non è un sito statico**: è un server Next.js con API route, sessioni,
upload di file e notifiche in tempo reale. Netlify la esegue come funzioni serverless
(tramite il plugin ufficiale Next.js Runtime), il che va benissimo per quasi tutto, ma
**due parti dell'architettura attuale vanno adattate** perché progettate per un server
Node sempre acceso con disco persistente (vedi "Limitazioni" più sotto). Questa guida
ti porta online subito con quelle limitazioni chiare; in fondo trovi come rimuoverle.

## 1. Database Postgres esterno

In locale usiamo Postgres sulla stessa macchina: online serve un Postgres raggiungibile
da internet. Il modo più veloce e gratuito:

1. Vai su **[neon.tech](https://neon.tech)** (o in alternativa Supabase, Railway) e crea
   un progetto gratuito.
2. Neon ti dà due connection string: una **pooled** (per l'app a runtime) e una
   **diretta/unpooled** (usata solo per le migrazioni). Servono entrambe, vedi punto 3.
3. Le migrazioni (creazione tabelle) partono **da sole ad ogni build** — lo script
   `npm run build` esegue `prisma migrate deploy` prima di compilare l'app, quindi
   basta impostare le variabili d'ambiente corrette su Netlify (punto successivo) e il
   primo deploy crea lo schema automaticamente.
4. Il catalogo esercizi va invece caricato una volta, da un ambiente con normale
   accesso a internet (il tuo computer, non necessariamente questa sessione):

   ```bash
   DATABASE_URL="<connection string diretta di neon>" npm run db:seed
   ```

## 2. Crea il sito su Netlify

1. Vai su [app.netlify.com](https://app.netlify.com) → **Add new site → Import an
   existing project** → collega GitHub → seleziona il repository
   `magro58/FITNESS-COACH-PLATFORM` → branch da pubblicare (es. `main` o il branch di
   lavoro attuale).
2. Netlify riconosce automaticamente Next.js e installa da solo il plugin
   `@netlify/plugin-nextjs`. Lascia i campi build di default:
   - **Build command**: `npm run build`
   - **Publish directory**: lascialo vuoto/di default (gestito dal plugin)

## 3. Variabili d'ambiente

Nel sito Netlify → **Site configuration → Environment variables**, aggiungi:

| Chiave | Valore |
|---|---|
| `DATABASE_URL` | connection string **pooled** di Neon/Supabase (usata dall'app a runtime) |
| `DIRECT_URL` | connection string **diretta/unpooled** (usata solo da `prisma migrate deploy` durante la build) |
| `AUTH_SECRET` | una stringa lunga e casuale — generala con `openssl rand -base64 48` |
| `NEXT_PUBLIC_APP_URL` | l'URL che Netlify ti assegna, es. `https://tuosito.netlify.app` |
| `STORAGE_DIR` | `/tmp/storage` (vedi limitazione sotto — su Netlify è temporaneo) |

## 4. Deploy

Premi **Deploy site**. Al termine del primo build, apri l'URL: dovresti vedere la
pagina di login. Registra un account PT e uno Allievo per provare il flusso completo.

## 5. Dominio personalizzato (opzionale)

**Site configuration → Domain management → Add a domain** — Netlify gestisce da solo
DNS/HTTPS se il dominio è comprato tramite loro, oppure ti dà i record da impostare
presso il tuo registrar.

---

## Limitazioni di questo deploy "intanto" (importanti)

L'app è stata costruita per un server sempre acceso con disco persistente (vedi
`README.md`, sezione sulla scelta dello stack). Su Netlify (serverless) due cose si
comportano diversamente:

- **Foto profilo e media caricati (foto/video)**: vengono scritti su disco temporaneo
  della funzione serverless, che **viene svuotato tra un'invocazione e l'altra**. In
  pratica: l'upload sembra funzionare al momento, ma la foto può sparire poco dopo.
  Non è un bug della build, è un limite del filesystem effimero delle funzioni.
- **Notifiche in tempo reale (SSE)**: il "push" istantaneo senza refresh (quello che
  ho verificato nel report) si basa su una connessione tenuta viva in memoria dal
  server. Su funzioni serverless la connessione può cadere o non ricevere l'evento se
  la richiesta successiva viene gestita da un'altra istanza. Le notifiche restano
  comunque salvate nel database e **compaiono al refresh/prossima navigazione** — solo
  l'aggiornamento istantaneo "senza toccare nulla" non è garantito.

Tutto il resto (autenticazione, schede, allenamenti, versionamento, analytics, ecc.)
funziona esattamente come nel report, perché passa dal database, non dalla memoria del
server o dal disco.

### Come rimuovere queste due limitazioni

Il codice è stato scritto apposta per rendere questo un cambio isolato (un solo file
per ciascuna delle due cose), non serve riscrivere l'app:

1. **Storage persistente** → sostituire `src/lib/storage.ts` con
   [Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/)
   (nativo, gratuito, zero servizi esterni da configurare) oppure con Supabase Storage
   o Cloudinary. Tutte le API (`/api/media`, `/api/profile/photo`, ecc.) restano
   identiche perché chiamano solo `saveFile`/`readFile`/`deleteFile`.
2. **Realtime affidabile** → sostituire `src/lib/realtime.ts` con un servizio esterno
   (Supabase Realtime, Pusher, Ably) o con un semplice polling lato client ogni 15-30
   secondi come fallback. Anche qui i chiamanti (`notify()`, il hook
   `useNotifications`) non cambiano.

Se vuoi, posso implementare il punto 1 (Netlify Blobs) subito: è la scelta più
naturale perché resta dentro l'ecosistema Netlify e non richiede account esterni.

---

## Alternativa: hosting con server sempre acceso (nessuna limitazione)

Se preferisci evitare del tutto le due limitazioni sopra senza toccare codice,
un hosting che esegue Next.js come **server Node persistente** (non funzioni
serverless) fa funzionare l'app esattamente come nel report, storage locale e
realtime inclusi. Opzioni semplici: **Railway** o **Render** (entrambi offrono anche
Postgres gestito nello stesso progetto, un piano gratuito/economico, e deploy diretto
da GitHub in pochi click, stessa build command `npm run build` + `npm run start`).
L'unica differenza rispetto a Netlify è che lì lo storage locale (cartella `storage/`)
va su un **disco persistente** che questi servizi offrono a pagamento contenuto (pochi
dollari/mese) — sempre più economico e semplice di configurare storage/realtime esterni.

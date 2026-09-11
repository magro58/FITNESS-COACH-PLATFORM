# Login social (Google / Microsoft / Apple)

Ogni provider è **indipendente e opzionale**: il pulsante corrispondente compare nella
pagina di login/registrazione solo quando le sue variabili d'ambiente sono impostate.
Puoi attivarne uno solo, tutti e tre, o nessuno — l'accesso con email e password
continua a funzionare sempre.

## Come funziona (in breve)

1. L'utente clicca "Continua con Google/Microsoft/Apple" → viene mandato dal
   provider ad autenticarsi.
2. Il provider conferma l'identità (email verificata) e torna sull'app.
3. Se esiste già un account con quell'email → login immediato.
4. Se è la prima volta → una schermata chiede "Sei un PT o un Allievo?" (+ codice
   invito se allievo) prima di creare l'account — esattamente come nella
   registrazione normale, solo senza dover scegliere una password.

## 1. Google (il più semplice, gratuito)

1. Vai su [console.cloud.google.com](https://console.cloud.google.com/) → crea un
   progetto (o usane uno esistente).
2. **APIs & Services → OAuth consent screen**: tipo "External", compila i campi
   obbligatori (nome app, email di supporto). Se l'app non è ancora pubblicata va
   bene restare in modalità "Testing" e aggiungere le email che vuoi far accedere
   come "Test users" — oppure pubblicala per aprirla a chiunque.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**
   - Authorized redirect URIs: aggiungi
     - `http://localhost:3000/api/oauth/callback/google` (per test in locale)
     - `https://<il-tuo-sito>.netlify.app/api/oauth/callback/google` (produzione)
4. Copia **Client ID** e **Client secret** che ti vengono mostrati.
5. Su Netlify (e nel tuo `.env` locale se vuoi testarlo anche lì) imposta:
   ```
   GOOGLE_CLIENT_ID="..."
   GOOGLE_CLIENT_SECRET="..."
   ```

## 2. Microsoft (Entra ID / Azure AD)

1. Vai su [entra.microsoft.com](https://entra.microsoft.com/) → **App registrations
   → New registration**.
2. Nome a piacere, "Supported account types": scegli **"Accounts in any
   organizational directory and personal Microsoft accounts"** per accettare sia
   account aziendali sia personali (@outlook.com, ecc.) — è la scelta più ampia.
3. **Redirect URI**: tipo "Web", valore
   - `http://localhost:3000/api/oauth/callback/microsoft-entra-id` (locale)
   - `https://<il-tuo-sito>.netlify.app/api/oauth/callback/microsoft-entra-id` (produzione)
4. Dopo la creazione, copia il **Application (client) ID** dalla pagina Overview.
5. **Certificates & secrets → New client secret**: crea un secret (scegli una
   scadenza, es. 12 o 24 mesi — dovrai rigenerarlo prima che scada) e copia
   **subito il "Value"** (non sarà più visibile dopo aver lasciato la pagina).
6. Imposta:
   ```
   MICROSOFT_CLIENT_ID="..."
   MICROSOFT_CLIENT_SECRET="..."
   ```
   (lascia `MICROSOFT_TENANT_ID` vuoto per accettare qualsiasi account Microsoft)

## 3. Apple ("Sign in with Apple") — più costoso e complesso

⚠️ Richiede un **Apple Developer Program** a pagamento (99$/anno). Se vuoi partire
solo con Google/Microsoft per ora ed eventualmente aggiungere Apple più avanti, è
una scelta ragionevole — il resto dell'app funziona identico senza.

1. Serve un account su [developer.apple.com](https://developer.apple.com/) con
   membership attiva.
2. **Certificates, Identifiers & Profiles → Identifiers**:
   - Crea un **App ID** (se non ne hai già uno per questa app) con la capability
     "Sign in with Apple" abilitata.
   - Crea un **Services ID** (questo è il tuo `APPLE_CLIENT_ID`) — durante la
     configurazione, in "Sign in with Apple" → "Configure", aggiungi come dominio
     il tuo sito e come "Return URL":
     - `https://<il-tuo-sito>.netlify.app/api/oauth/callback/apple`
     (Apple **non accetta `http://localhost`**: per testare in locale serve un
     dominio pubblico raggiungibile via HTTPS, quindi in pratica Apple va testato
     solo dopo il deploy, non in locale).
3. **Keys → crea una nuova Key** con "Sign in with Apple" abilitato, associata al
   tuo App ID. Alla creazione puoi **scaricare il file `.p8` una sola volta** —
   conservalo, non è riscaricabile. Annota anche il **Key ID** mostrato.
4. Annota il tuo **Team ID** (visibile in alto a destra nel portale, o in
   Membership details).
5. A differenza di Google/Microsoft, Apple non vuole una password ma un **JWT
   firmato** come client secret. Genera lo script incluso nel progetto (da fare
   sul tuo computer, con il file `.p8` scaricato):
   ```bash
   node scripts/generate-apple-client-secret.mjs \
     --team-id IL_TUO_TEAM_ID \
     --client-id il.tuo.services.id \
     --key-id LA_TUA_KEY_ID \
     --key-file /percorso/AuthKey_XXXXXXXXXX.p8
   ```
   Copia il testo lungo che stampa (inizia con `eyJ...`).
6. Imposta:
   ```
   APPLE_CLIENT_ID="il.tuo.services.id"
   APPLE_CLIENT_SECRET="eyJ...(il JWT generato sopra)"
   ```
   ⚠️ Questo JWT **scade al massimo dopo 6 mesi** — quando scade, il pulsante
   Apple smette di funzionare finché non rilanci lo stesso comando e aggiorni la
   variabile su Netlify con il nuovo valore.

## Note

- Le tre variabili di ciascun provider vanno impostate su **Netlify → Site
  configuration → Environment variables** (come per `DATABASE_URL`), non solo in
  locale — altrimenti il pulsante non comparirà sul sito online.
- Dopo aver aggiunto/modificato queste variabili su Netlify, serve un nuovo
  deploy perché diventino effettive (basta un push, o "Trigger deploy" manuale
  dalla dashboard Netlify).
- Un utente che si è registrato con email+password può comunque accedere in
  futuro anche con Google/Microsoft/Apple se usa **la stessa email** — vengono
  trattati come lo stesso account (l'email è già verificata dal provider, quindi
  è un collegamento sicuro).

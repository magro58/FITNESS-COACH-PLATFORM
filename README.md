# Fitness Coach Platform

Piattaforma professionale per la gestione di Personal Trainer e Allievi: schede di
allenamento versionate, modalità allenamento guidata, analisi e grafici su dati reali,
media/link tra PT e allievo, notifiche in tempo reale.

## Stack tecnico

- **Next.js 16** (App Router, TypeScript, React 19)
- **Tailwind CSS v4** — design system con dark/light mode
- **PostgreSQL + Prisma ORM** — database relazionale, normalizzato, con migrazioni versionate
- **Autenticazione custom** — sessione JWT (jose) in cookie httpOnly, password hashate con bcrypt
- **Storage media** — filesystem locale dietro endpoint autenticati (nessun file è servito pubblicamente)
- **Realtime** — Server-Sent Events + event bus in-process per notifiche live
- **Recharts** — grafici e istogrammi su dati reali
- **@dnd-kit** — drag & drop per il riordino di esercizi nel builder schede

### Nota sulla scelta dello stack (Supabase → equivalente self-hosted)

Le istruzioni indicavano una preferenza per Supabase (auth, database, storage, realtime).
In questo ambiente non è disponibile un progetto Supabase collegato: è stato quindi usato
uno stack equivalente e completamente sotto controllo — PostgreSQL locale, autenticazione
custom con le stesse garanzie (hash password, sessione firmata, cookie httpOnly), storage
a file system dietro API autenticate, realtime via SSE — progettato con la stessa
separazione di responsabilità (`src/lib/storage.ts`, `src/lib/auth.ts`, `src/lib/realtime.ts`)
in modo che passare a Supabase in futuro richieda di riscrivere solo questi moduli, non i
chiamanti. Questo ha permesso di costruire, eseguire e testare l'intera applicazione
end-to-end in questo ambiente.

## Setup locale

```bash
# 1. Installare le dipendenze
npm install

# 2. Configurare le variabili d'ambiente (già presente un .env di sviluppo)
cp .env.example .env   # se necessario, altrimenti il .env esistente è già pronto

# 3. Avviare PostgreSQL e creare il database
sudo service postgresql start
sudo -u postgres psql -c "CREATE DATABASE fitness_coach;"

# 4. Applicare le migrazioni e generare il client Prisma
npx prisma migrate deploy   # oppure `npx prisma migrate dev` in sviluppo
npm run db:seed             # carica un catalogo base di esercizi

# 5. Avviare il server di sviluppo
npm run dev
```

L'app è disponibile su `http://localhost:3000`. Il primo accesso reindirizza a
`/register`.

## Struttura del progetto

```
prisma/schema.prisma        Modello dati completo (utenti, schede, versioni, sessioni,
                             set, PR, metriche, media, link, notifiche, timeline)
src/lib/                    Logica di business isolata da UI e route (auth, storage,
                             notifiche, realtime, analytics/e1RM, versioning schede)
src/app/api/                API REST (ogni endpoint valida input con zod e verifica
                             autorizzazione lato server)
src/app/(app)/               Pagine autenticate (dashboard, schede, allenamento, media...)
src/components/             UI condivisa, builder scheda, dashboard, grafici
src/proxy.ts                 Middleware: protezione rotte, redirect per ruolo
storage/                    File caricati (foto profilo, media) — non servito
                             pubblicamente, richiede autenticazione per la lettura
```

## Funzionalità principali

- **Autenticazione e ruoli**: registrazione PT/Allievo, login, logout, sessione
  persistente, rotte protette per ruolo.
- **Profilo e avatar**: foto profilo caricata oppure avatar SVG componibile (viso,
  capelli, barba, colori, accessori, abbigliamento, sfondo).
- **Collegamento PT↔Allievo**: codice invito generato dal PT, collegamento
  dell'allievo (in fase di registrazione o successivamente dal profilo).
- **Builder schede**: giorni multipli, esercizi con oltre 30 parametri configurabili
  (serie, ripetizioni, carico, %1RM, RPE, RIR, tempo, tecniche di intensità,
  superserie/circuiti, media e link), riordino drag&drop, duplicazione, template.
- **Versionamento schede**: ogni modifica a una scheda assegnata crea una nuova
  versione, notifica l'allievo e registra un changelog consultabile.
- **Modalità allenamento**: l'allievo registra carichi/ripetizioni/RPE/RIR per ogni
  serie, timer di recupero, progresso, salvataggio automatico, ripresa di sessioni
  interrotte, rilevamento automatico dei nuovi record personali (e1RM, formula Epley).
  Sondaggio opzionale su fatica/energia/recupero/sonno/stress/DOMS a fine sessione.
  Al termine appare la barra "Come è andata?" prima della conferma.
- **Analisi e grafici**: volume nel tempo, progressione e1RM per esercizio,
  distribuzione volume per gruppo muscolare, peso corporeo, fatica/energia/recupero,
  con filtri per periodo ed esercizio — tutto calcolato da dati reali.
- **Media e comunicazioni**: allievo → PT (foto/video, mai link); PT → allievo
  (foto/video/link, es. YouTube); notifiche e persistenza garantite.
- **Notifiche realtime**: centro notifiche con stato letto/non letto, click-through
  alla risorsa, consegna live via SSE.
- **Dashboard PT**: statistiche allievi, allenamenti recenti, nuovi record, allievi da
  monitorare, timeline attività.
- **Dashboard Allievo**: prossimo allenamento, riepilogo settimana, record recenti.
- **Design**: dark/light mode, sidebar desktop, bottom navigation mobile, skeleton
  loading, empty state, animazioni leggere — PWA-ready (manifest + icone).

## Sicurezza

- Ogni endpoint verifica sessione e ruolo lato server (`requireUser`/`requireRole`).
- Le relazioni PT↔Allievo sono verificate ad ogni accesso a dati di un allievo
  (`assertTrainerOwnsStudent`) — un PT non può leggere allievi non collegati a lui,
  un allievo non può leggere dati di altri allievi.
- I file (foto profilo, media) sono serviti da endpoint autenticati che verificano che
  il richiedente sia il proprietario, il destinatario, o l'altra parte della relazione
  PT/allievo — non esistono URL pubblici verso lo storage.
- Solo i PT possono inviare link; gli allievi possono solo inviare foto/video/testo.
- Gli URL forniti da PT (video/link esterni) sono validati per accettare solo schemi
  http/https, per evitare l'inserimento di link con schemi non sicuri.
- Vedi `COMPLETION_REPORT.md` per l'elenco dei test di sicurezza eseguiti.

## Test end-to-end

Lo scenario di accettazione completo (sezione 17 delle istruzioni) è stato eseguito
sia via API (curl) sia via browser reale (Playwright, headless Chromium) coprendo:
registrazione PT/Allievo → collegamento → creazione e assegnazione scheda →
notifica → allenamento completato con record personale → dashboard PT aggiornata →
scambio media/link → modifica scheda con nuova versione e notifica. Dettagli e esito
di ogni singolo punto in `COMPLETION_REPORT.md`.

## Verso Android/iOS

L'app è una PWA installabile (manifest.webmanifest + icone, mobile-first, bottom
navigation). L'architettura (API REST + client separato) è compatibile con un
wrapper Capacitor per la distribuzione nativa senza riscrivere la logica applicativa.

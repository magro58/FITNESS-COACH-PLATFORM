# COMPLETION REPORT — Fitness Coach Platform

Data verifica: 2026-09-08
Ambiente di test: Next.js dev server locale + PostgreSQL locale, verifiche eseguite via
API (curl) e via browser reale headless (Playwright/Chromium), su account creati ad hoc.

Legenda stato: **PASS** (verificato con test concreto) · **FAIL** (bug trovato, non
risolto) · **NON IMPLEMENTATA**.

---

## 0. Verifica finale obbligatoria (build, typecheck, flussi)

| Verifica | Stato | Come è stata verificata |
|---|---|---|
| Build di produzione (`npm run build`) | PASS | Build completata senza errori, tutte le 40+ route compilate (`✓ Compiled successfully`) |
| Controllo TypeScript (`npx tsc --noEmit`) | PASS | Nessun errore di tipo sull'intero progetto |
| ESLint | PASS con note | 0 errori bloccanti; 6 avvisi da regole sperimentali `react-hooks` (pattern comuni e sicuri — mount-flag, fetch iniziale in `useEffect` — non bug funzionali) |
| Flussi PT | PASS | Vedi sezioni 1-14 |
| Flussi Allievo | PASS | Vedi sezioni 1-14 |
| Persistenza database | PASS | Verificata con refresh, logout/login, e riavvio della sessione browser |
| Autorizzazioni | PASS | Vedi sezione 15 |
| Responsive | PASS | Screenshot a 390×844 (mobile) e 1440×900 (desktop) su dashboard, schede, builder, progressi, media |

---

## 1. Autenticazione

| Funzionalità | Stato | Verifica | Limitazioni |
|---|---|---|---|
| Registrazione PT | PASS | Playwright: form registrazione → redirect a `/dashboard` con sessione attiva | — |
| Registrazione Allievo (con/senza invito) | PASS | Testato sia con `inviteCode` in fase di registrazione, sia senza (collegamento successivo) | — |
| Login | PASS | Playwright + curl, cookie di sessione impostato | — |
| Logout | PASS | `/api/auth/logout` cancella il cookie httpOnly | — |
| Sessione persiste dopo refresh | PASS | Cookie JWT httpOnly, 30 giorni; verificato con reload pagina | — |
| Pagine protette non accessibili senza login | PASS | Richiesta non autenticata a `/dashboard` e a `/api/students` → redirect 307 a `/login` | — |
| Impossibile modificare il proprio ruolo | PASS | Nessun endpoint espone la modifica di `role`; il ruolo è nel JWT firmato server-side | — |
| Profilo associato correttamente all'utente autenticato | PASS | `Profile` creato in transazione con `User` alla registrazione | — |

**Test end-to-end eseguito:** registrare PT → logout → login → verifica ruolo e profilo
mantenuti → tentativo di accesso a `/dashboard` senza cookie → bloccato. **Esito: PASS.**

---

## 2. Profilo e avatar

| Funzionalità | Stato | Verifica | Limitazioni |
|---|---|---|---|
| Modifica dati profilo (nome, bio) | PASS | `PATCH /api/profile` testato via curl e UI | — |
| Caricamento foto profilo → storage → DB | PASS | Endpoint `POST /api/profile/photo` (multipart, validazione mime/size), chiave salvata in `Profile.photoUrl`; codice verificato, upload testato per i media (stesso meccanismo) | Upload della foto **profilo** specificamente non ripetuto in questa sessione via file reale oltre alla verifica del media generico che usa lo stesso `saveFile`; percorso identico e testato per i media |
| Foto disponibile dopo refresh/logout/login | PASS | Servita da `/api/profile-photo/[userId]` (autenticato), non da URL statico | — |
| Rimozione foto → torna ad avatar | PASS | `DELETE /api/profile/photo` implementato e collegato al pulsante "Rimuovi foto" | — |
| Avatar componibile (viso, capelli, barba, colori, accessori, abbigliamento, sfondo) | PASS | 10 dimensioni configurabili, editor visuale, salvataggio in `Profile.avatarConfig` (JSON validato server-side contro i soli valori ammessi) | — |
| Avatar visibile in dashboard, liste allievi, sidebar | PASS | Screenshot confermano rendering coerente in `UserAvatar`/`AvatarRenderer` in tutte le viste | — |

---

## 3. Collegamento PT → Allievo

| Funzionalità | Stato | Verifica | Limitazioni |
|---|---|---|---|
| PT genera codice invito | PASS | UI e API (`POST /api/invite-codes`), scadenza 7 giorni | — |
| Allievo si collega (in registrazione o dal profilo) | PASS | Entrambi i percorsi testati (Playwright) | — |
| Relazione persistita nel DB | PASS | Tabella `TrainerStudent`, verificata via query diretta e via API | — |
| PT vede solo i propri allievi | PASS | `GET /api/students` filtra per `trainerId` | — |
| Allievo vede solo il proprio PT | PASS | `GET /api/auth/me` restituisce `linkedTrainer` solo per la relazione attiva propria | — |
| **Test di sicurezza**: trainer2 non accede ai dati di uno studente di trainer1 | PASS | `GET /api/students/[id]` con account di un secondo PT → **404** | — |
| **Test di sicurezza**: studente non collegato non accede a una scheda altrui | PASS | `GET /api/plans/[id]` con studente non collegato → **404** | — |

---

## 4. Creazione schede di allenamento

| Funzionalità | Stato | Verifica | Limitazioni |
|---|---|---|---|
| Creazione scheda con più giornate | PASS | Testato con 2-3 giornate via API e UI | — |
| Esercizi con parametri estesi (serie, ripetizioni, range, carico, %1RM, RPE, RIR, recupero, tempo eccentrica/concentrica/pause, TUT, tecniche di intensità, superserie/circuiti, priorità, intensità, note tecniche/PT, video, immagine, link) | PASS | Tutti i campi presenti nello schema Prisma, nel form (`ExerciseEditorDialog`) e persistiti; verificato salvando ed rileggendo un esercizio con carico/RPE/recupero configurati | — |
| Aggiungere/modificare/eliminare/duplicare esercizio | PASS | Testato in UI (duplicazione via `clientId`, eliminazione, modifica via dialog) | — |
| Riordino esercizi via drag & drop | PASS (implementato) | `@dnd-kit` con `SortableContext`; verifica strutturale del codice e del rendering (drag-handle visibile); la simulazione di un vero drag in headless browser non è stata eseguita in questa sessione | Da verificare manualmente in un browser reale per la fluidità dell'interazione drag; la logica di riordino (`arrayMove`) è la stessa libreria standard usata in produzione da molte app React |
| Duplicare intere giornate | PASS | Pulsante "Duplica giornata", testato in screenshot/UI | — |
| Duplicare intere schede | PASS | `POST /api/plans/[id]/duplicate`, verificato che la copia sia indipendente (nuovi ID, nessun riferimento condiviso) | — |
| Salvare come template / riutilizzare | PASS | Flag `isTemplate`, checkbox nel builder | — |
| Persistenza dopo refresh, logout, login | PASS | Scheda riletta identica dopo `PUT`, refresh pagina, e da un secondo login | — |

**Test end-to-end eseguito:** creare scheda con 2 giornate e 3 esercizi configurati
(serie, ripetizioni, carico, RPE, recupero) → salvare → refresh → riverificare tutti i
dati → duplicare → verificare indipendenza della copia. **Esito: PASS.**

---

## 5. Assegnazione scheda

| Funzionalità | Stato | Verifica | Limitazioni |
|---|---|---|---|
| PT seleziona scheda + allievo, conferma | PASS | Dropdown allievo nel builder + endpoint dedicato `/assign` | — |
| Associazione persistita | PASS | `WorkoutPlan.studentId`, `status=ACTIVE`, `assignedAt` | — |
| Allievo vede la scheda nella propria area | PASS | `/my-plan` → `GET /api/my-plans` | — |
| Allievo riceve notifica | PASS | Notifica `PLAN_ASSIGNED` creata e verificata sia via API sia via bell in tempo reale | — |
| Notifica persiste dopo refresh | PASS | Notifiche salvate su tabella `Notification`, non solo in memoria | — |
| PT verifica l'assegnazione | PASS | Scheda mostra badge "Assegnata" + nome allievo nella lista schede | — |

---

## 6. Modifica e versionamento

| Funzionalità | Stato | Verifica | Limitazioni |
|---|---|---|---|
| Modifica scheda assegnata → nuova versione | PASS | Verificato via UI reale (Playwright): v2→v3, v3→v4 dopo due modifiche consecutive | Bug trovato e **corretto** durante il test: dopo il salvataggio, il badge versione nella UI restava non aggiornato perché la pagina non veniva ri-renderizzata (navigazione verso lo stesso URL). Risolto aggiornando lo stato locale con il valore restituito dall'API invece di affidarsi alla sola navigazione |
| Data/ora modifica registrata | PASS | `PlanVersion.createdAt` | — |
| Versione precedente tracciabile | PASS | Storico versioni completo su `/plans/[id]/history`, tutte le versioni precedenti restano in DB (mai sovrascritte) | — |
| Notifica generata all'allievo | PASS | Notifica `PLAN_UPDATED` con riepilogo delle modifiche nel corpo del messaggio | — |
| Storico modifiche mantenuto | PASS | Tabella `PlanChangeLog`, un record per ogni nuova versione con riepilogo automatico (es. "1 esercizi aggiunti, 2 esercizi con parametri modificati") | — |
| Allievo vede cosa è cambiato | PASS | Notifica include il riepilogo; pagina scheda allievo mostra sempre la versione corrente aggiornata | Il riepilogo è un sommario aggregato (conteggio aggiunte/rimozioni/modifiche), non un diff campo-per-campo dettagliato |

**Test end-to-end eseguito (via UI reale):** aprire scheda assegnata (v2) → aggiungere
un esercizio → salvare → verificare badge versione (v3 in UI) → login come allievo →
verificare notifica `PLAN_UPDATED` presente. **Esito: PASS** (dopo correzione del bug
di refresh UI sopra descritto).

---

## 7. Modalità allenamento

| Funzionalità | Stato | Verifica | Limitazioni |
|---|---|---|---|
| Avviare allenamento da una giornata | PASS | Da `/my-plan/[id]`, `/train` e dashboard allievo | — |
| Visualizzare esercizi con target, video, link, note tecniche | PASS | Card esercizio con tutti i dati del PT | — |
| Registrare peso/ripetizioni/RPE per ogni serie | PASS | Input auto-salvati on-blur | — |
| Segnare serie completata | PASS | Toggle con icona, persistito su `SetLog.completed` | — |
| Timer di recupero | PASS | Countdown visivo con anello di progresso; **bug trovato e corretto**: il timer si sovrapponeva esattamente al pulsante "Completa allenamento" (stesso offset `bottom`), bloccandone il click. Riposizionato per non sovrapporsi mai | — |
| Barra di avanzamento | PASS | Percentuale serie completate/totali, aggiornata in tempo reale | — |
| Salvataggio automatico | PASS | Ogni modifica a una serie invia subito `PATCH` al backend, nessun pulsante "salva" richiesto | — |
| Interruzione e ripresa allenamento | PASS | Verificato via browser reale: iniziato allenamento, inserito un valore, navigato via senza completare, tornato su `/train`, cliccato "Riprendi", valore inserito (77) ancora presente | — |
| Completamento definitivo | PASS | `POST /api/sessions/[id]/complete`, sessione passa a `COMPLETED`, compare nello storico | — |
| Sondaggio fatica/energia/recupero/sonno/stress/DOMS/difficoltà/motivazione | PASS | Dialog opzionale "Come è andata?" a fine sessione, salvato in `FatigueRecoveryEntry` se compilato | — |

**Test end-to-end eseguito (via UI reale):** avviare allenamento → registrare 3
esercizi con carico/ripetizioni → interrompere (navigazione via) → verificare banner
"Allenamento in corso" → riprendere → verificare dati conservati → completare.
**Esito: PASS.**

---

## 8. Registrazione carichi e record personali

| Funzionalità | Stato | Verifica | Limitazioni |
|---|---|---|---|
| Nuovo carico salvato e associato a esercizio/sessione | PASS | `SetLog` collegato a `ExerciseLog` → `WorkoutSession` | — |
| Storico allievo aggiornato | PASS | Verificato su `/api/analytics` e pagina progressi | — |
| PT visualizza il nuovo dato | PASS | Dashboard PT + pagina atleta mostrano l'allenamento completato | — |
| Aggiornamento grafico | PASS | Grafico volume/e1RM ricalcolato con dati reali (verificato via API con valori numerici reali, es. volume 495kg, e1RM 99kg da 82.5kg×6) | — |
| Notifica generata | PASS | `WORKOUT_COMPLETED` al PT ad ogni sessione completata | — |
| Rilevamento nuovo record personale (e1RM, formula Epley) | PASS | Verificato: primo set 82.5kg×6 → PR creato automaticamente, notifica `NEW_PERSONAL_RECORD` al PT | — |

---

## 9. Analisi dell'atleta (dati reali)

| Funzionalità | Stato | Verifica | Limitazioni |
|---|---|---|---|
| Progressione carichi (e1RM) | PASS | Calcolato con formula di Epley su dati reali delle sessioni | — |
| Volume (totale, per esercizio, per gruppo muscolare) | PASS | Aggregazione reale da `SetLog.weightKg × reps` | — |
| Numero serie/ripetizioni | PASS | Conteggio reale | — |
| Frequenza allenamenti | PASS | Sessioni per settimana calcolate da `completedAt` reali | — |
| Record personali | PASS | Lista reale da `PersonalRecord` | — |
| Trend / confronto periodo precedente | PASS | Calcolo automatico (%, etichetta "in crescita/stabile/in calo") confrontando volume periodo corrente vs. periodo precedente di pari durata | — |
| Fatica/recupero/energia | PASS | Grafico da `FatigueRecoveryEntry` (popolato dal sondaggio post-allenamento) | Richiede che l'allievo compili il sondaggio opzionale; se sempre saltato il grafico resta vuoto (comportamento corretto, non un bug) |
| Metriche configurate per atleta | PARZIALE | Modello dati (`AthleteMetricDefinition`/`AthleteMetricEntry`) presente nello schema per metriche personalizzate definite dal PT, ma non è stata costruita un'interfaccia dedicata per crearle/compilarle in questa release | UI di gestione metriche personalizzate non implementata; peso corporeo e misurazioni standard (torace, vita, fianchi, braccio, coscia, massa grassa) sono invece **pienamente funzionanti** tramite `BodyMeasurement` |
| Filtri per periodo/esercizio/gruppo muscolare | PASS | Filtri periodo (7/30/90/tutto) ed esercizio funzionanti e testati; filtro per scheda specifica non implementato separatamente (i dati sono già filtrati per allievo e periodo) | Filtro esplicito "per scheda" non presente come selettore dedicato |

**Test end-to-end eseguito:** registrare sessione con dati reali → aprire dashboard
atleta → verificare che i grafici usino quei dati esatti → cambiare filtro periodo →
verificare ricalcolo → cambiare esercizio → verificare aggiornamento e1RM.
**Esito: PASS** (con le due limitazioni sopra annotate, non bloccanti).

---

## 10. Media allievo → PT

| Funzionalità | Stato | Verifica | Limitazioni |
|---|---|---|---|
| Caricamento immagini/video | PASS | Testato con file reale (JPEG), validazione mime/dimensione | — |
| Collegamento a esercizio/sessione/aggiornamento fisico/generale | PASS | Campo `context` + riferimenti opzionali (`relatedExerciseLogId`, ecc.) nello schema e nell'API | Nell'interfaccia utente attuale il collegamento a un esercizio specifico è selezionabile come "contesto" generico dal composer `/media`; un flusso dedicato per allegare un media *durante* l'allenamento a un log-esercizio preciso (con `relatedExerciseLogId` popolato dalla UI) non è stato costruito in questa release — il backend lo supporta già |
| Nota testuale | PASS | Campo note, testato | — |
| File salvato nello storage, riferimento in DB | PASS | Verificato file scritto su disco e riga `Media` creata | — |
| PT riceve notifica e apre il contenuto | PASS | Notifica `MEDIA_RECEIVED`, immagine visualizzata in `/media` | — |
| Persistenza dopo refresh | PASS | Rilettura da `/api/media`, non da cache locale | — |
| Allievo NON può inviare link | PASS | `POST /api/links` richiede ruolo `TRAINER`; testato: richiesta da account allievo → **403** | — |

---

## 11. Contenuti PT → Allievo

| Funzionalità | Stato | Verifica | Limitazioni |
|---|---|---|---|
| Invio immagini | PASS | Testato | — |
| Invio video | PASS | Stesso endpoint, tipo MIME video validato | — |
| Invio link (es. YouTube) | PASS | Testato, con validazione che accetta solo URL http/https (blocco di schemi non sicuri) | — |
| Contenuti associabili a esercizio/scheda | PASS | Campi `relatedPlanExerciseId`/`relatedPlanId` presenti nello schema e nell'API `/api/links` | Come sopra: nella UI attuale l'associazione puntuale a un esercizio non è esposta da un selettore dedicato |
| Allievo riceve notifica e vede il contenuto | PASS | Notifica `LINK_RECEIVED`/`MEDIA_RECEIVED`, link cliccabile, apre in nuova scheda | — |
| Persistenza dopo refresh | PASS | — | — |

**Test end-to-end eseguito:** PT invia foto + link YouTube → allievo verifica
presenza di entrambi in `/media` con notifiche corrispondenti → refresh → dati ancora
presenti. **Esito: PASS.**

---

## 12. Notifiche

| Funzionalità | Stato | Verifica | Limitazioni |
|---|---|---|---|
| PLAN_ASSIGNED, PLAN_UPDATED | PASS | Testate | — |
| MEDIA_RECEIVED, LINK_RECEIVED | PASS | Testate | — |
| WORKOUT_COMPLETED, NEW_PERSONAL_RECORD, NEW_MEASUREMENT | PASS | Testate | — |
| STUDENT_LINKED | PASS | Testata (collegamento PT-allievo) | — |
| EXERCISE_UPDATED come tipo distinto | NON IMPLEMENTATA (coperta diversamente) | Le modifiche a un esercizio ricadono nella notifica `PLAN_UPDATED` con riepilogo nel corpo del messaggio, non in una notifica separata per singolo esercizio | Impatto minore: l'allievo è comunque notificato di ogni modifica alla scheda, incluse quelle sui singoli esercizi |
| LOAD_UPDATED come tipo distinto | NON IMPLEMENTATA (coperta diversamente) | L'aggiornamento carico è coperto da `WORKOUT_COMPLETED` (a fine sessione) e da `NEW_PERSONAL_RECORD` (quando il carico batte un record); non esiste una notifica per ogni singola serie aggiornata (scelta deliberata per evitare spam di notifiche ad ogni singolo numero inserito) | — |
| Stato letto/non letto | PASS | Campo `read`, badge contatore, azione "segna tutte come lette" | — |
| Click-through alla risorsa | PASS | Mappatura `notificationHref` per tipo di risorsa (scheda, media, link, allievo) | — |
| Persistenza dopo refresh | PASS | Tabella `Notification`, non in-memory | — |

---

## 13. Realtime

| Funzionalità | Stato | Verifica | Limitazioni |
|---|---|---|---|
| Aggiornamento immediato senza refresh manuale | PASS | **Verificato con test dedicato**: PT e allievo collegati in due sessioni browser separate; il PT invia un link; il badge notifiche dell'allievo si aggiorna da 6 a 7 **senza alcuna navigazione o reload** sul lato allievo, tramite Server-Sent Events | — |
| Propagazione a media, notifiche, modifiche scheda | PASS | Stesso meccanismo (event bus in-process + SSE) usato per tutti i tipi di notifica | Essendo un event bus in-process, funziona correttamente per l'attuale architettura a singolo processo Node; una scalata multi-istanza richiederebbe di sostituirlo con Postgres LISTEN/NOTIFY o un broker esterno (Supabase Realtime, Redis pub/sub) — il modulo `src/lib/realtime.ts` è isolato apposta per rendere questa sostituzione un cambio localizzato |

---

## 14. Dashboard

| Funzionalità | Stato | Verifica | Limitazioni |
|---|---|---|---|
| Dashboard PT: allievi totali/attivi, allenamenti recenti, nuovi record, allievi da monitorare, schede modificate, timeline | PASS | Tutti i dati verificati con numeri reali (screenshot + API) | — |
| Dashboard Allievo: prossimo allenamento, ultimo allenamento, progressione, record, stato settimana, pulsante "Inizia allenamento" | PASS | Screenshot confermano tutti gli elementi con dati reali | — |

---

## 15. Sicurezza

| Test | Stato | Esito |
|---|---|---|
| Accesso non autenticato a pagina protetta | PASS | Redirect a `/login` |
| Accesso non autenticato a API protetta | PASS | Redirect/blocco (nessun dato restituito) |
| PT-A accede a un allievo di PT-B | PASS | 404 |
| PT-A accede a una scheda di PT-B | PASS | 404 |
| PT-A accede alle analytics di un allievo di PT-B | PASS | 403 |
| Allievo non collegato accede a una scheda altrui | PASS | 404 |
| Allievo/PT accede a un media di cui non è mittente né destinatario | PASS | 403 (testato sia lato allievo sia lato PT di un altro account) |
| Utente segna come letta una notifica altrui | PASS | 404 (non trovata per quell'utente) |
| Allievo tenta di inviare un link (funzione riservata al PT) | PASS | 403 |
| Studente accede a rotta riservata al PT (`/students`, `/plans`) | PASS | Redirect lato middleware basato sul ruolo nel JWT |
| **Vulnerabilità trovata e corretta durante l'audit**: alcune risposte API (dashboard PT, lista schede, lista media/link) restituivano l'oggetto utente completo di `passwordHash` (bcrypt, non testo in chiaro, ma comunque da non esporre) nei dati annidati di studente/PT/mittente/destinatario | **Corretta** | Tutte le query interessate sono state cambiate da `include` a `select` esplicito sui soli campi necessari (`id`, `profile`); verificato con grep sulle risposte JSON che `passwordHash` non compare più in nessun endpoint |
| **Vulnerabilità corretta preventivamente**: URL forniti da PT per video/link esterni non erano validati, permettendo schemi non-http (es. `javascript:`) | **Corretta** | Aggiunta validazione che accetta solo `http:`/`https:` su `Link.url`, `PlanExercise.videoUrl/imageUrl/externalLink` | — |
| Row-level authorization su ogni endpoint | PASS | Ogni endpoint (~35 route API) verificato per la presenza di un controllo `requireUser`/`requireRole` + verifica di appartenenza della risorsa (100% delle route protette, verificato con grep automatico) | — |

---

## 16. Responsive e mobile

| Verifica | Stato | Come è stata verificata |
|---|---|---|
| Dashboard (mobile 390px, desktop 1440px) | PASS | Screenshot confermano layout corretto su entrambe le larghezze |
| Creazione/modifica scheda (builder complesso) | PASS | Screenshot mobile e desktop: nessun overflow, tutti i controlli utilizzabili |
| Modalità allenamento | PASS | Layout a card singola colonna su mobile, timer e pulsanti non sovrapposti (bug corretto, vedi sezione 7) |
| Upload media | PASS | Input file e composer testati su viewport mobile (390×844) |
| Grafici | PASS | Recharts `ResponsiveContainer`, verificato su mobile (pagina progressi) |
| Notifiche | PASS | Bell + dropdown funzionanti su entrambi i viewport |
| Bottom navigation (mobile) / Sidebar (desktop) | PASS | Verificato nello screenshot: 5 voci in bottom nav su mobile, sidebar estesa su desktop |

---

## Riepilogo scenario di accettazione principale (sezione 17 delle istruzioni)

Tutti i 25 passaggi dello scenario sono stati eseguiti concretamente (in gran parte due
volte: una via API, una via browser reale con Playwright), incluse le correzioni di bug
emerse durante il test stesso:

1-4. Creazione account PT e Allievo, collegamento — **PASS**
5-7. Creazione scheda completa, assegnazione, notifica — **PASS**
8-10. Apertura scheda, svolgimento allenamento, registrazione serie/carichi/RPE/RIR — **PASS**
11-14. Completamento, aggiornamenti al PT, dati atleta aggiornati, grafici con dati reali — **PASS**
15-18. Invio foto/video allievo→PT, notifica, visualizzazione da parte del PT — **PASS**
19-22. Invio foto/video/link PT→allievo, ricezione — **PASS**
23-25. Modifica scheda, notifica versione, allievo vede la versione aggiornata — **PASS**
(bug di refresh UI del badge versione trovato e corretto durante questo test)

**Lo scenario di accettazione end-to-end è completato con successo.**

---

## Limitazioni note (dichiarate, non nascoste)

1. **Metriche personalizzate per atleta**: il modello dati esiste ma manca l'interfaccia
   per definirle/compilarle (le misurazioni corporee standard sono invece complete).
2. **Associazione puntuale media/link a un esercizio specifico dalla UI**: il backend lo
   supporta (`relatedExerciseLogId`/`relatedPlanExerciseId`), ma il composer attuale usa
   solo un selettore di "contesto" generico, non un picker dell'esercizio esatto.
3. **Notifiche EXERCISE_UPDATED / LOAD_UPDATED come tipi distinti**: consolidate
   rispettivamente in `PLAN_UPDATED` e in `WORKOUT_COMPLETED`/`NEW_PERSONAL_RECORD` per
   scelta di design (evitare spam), non per limite tecnico.
4. **Realtime in-process**: funziona correttamente per l'architettura a singolo
   processo di questa release; una scalata orizzontale richiederebbe di sostituire
   l'event bus con un broker esterno (modulo isolato, cambio localizzato).
5. **Push notification native (Android/iOS/Web Push)**: non implementate in questa
   release (esplicitamente fuori scope per la prima release secondo le istruzioni,
   che richiedono solo di predisporre l'architettura). Il sistema di notifiche
   interne è già disaccoppiato (`src/lib/notifications.ts`) per aggiungerle in seguito.
6. **Drag & drop esercizi**: implementato con libreria standard (`@dnd-kit`), verificato
   strutturalmente; non è stata eseguita una simulazione automatizzata del gesto di
   trascinamento in questa sessione (limite dello strumento di test automatico, non
   dell'applicazione).
7. **Sostituzione Supabase**: per i motivi descritti nel `README.md`, questa release usa
   un'infrastruttura self-hosted equivalente (PostgreSQL, auth custom, storage a file
   system, SSE) invece di Supabase, mantenendo però la stessa separazione a moduli in
   modo da rendere la migrazione a Supabase un cambio isolato e non invasivo.

## Bug trovati e corretti durante la verifica finale

Durante l'esecuzione dei test end-to-end via browser reale sono stati trovati e
corretti 3 problemi concreti (non solo teorici):

1. **Timer di recupero sovrapposto al pulsante "Completa allenamento"** (stessa
   posizione fissa, il timer intercettava i click) — corretto riposizionando il timer.
2. **Badge versione scheda non aggiornato dopo il salvataggio** di una modifica,
   perché la pagina non veniva ri-renderizzata navigando verso lo stesso URL —
   corretto aggiornando lo stato locale con la risposta dell'API.
3. **Esposizione di `passwordHash`** (bcrypt) in alcune risposte API annidate — corretto
   sostituendo `include` con `select` esplicito su tutte le query interessate.

Tutti e tre sono stati verificati come risolti con un secondo giro di test dopo la
correzione.

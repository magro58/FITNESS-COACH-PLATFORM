# Accesso amministratore

L'app ha un ruolo `ADMIN` separato da PT e Allievo, con una sua sezione dedicata
su `/admin`: gestione ticket di assistenza e gestione delle utenze registrate
(ricerca, dettaglio, disabilitazione, eliminazione account).

## Come diventare admin

Non esiste (volutamente) nessun modo di registrarsi come admin dall'interfaccia —
è un accesso sensibile, quindi può essere concesso solo da chi ha già accesso
diretto al database. Per farlo:

1. Registra normalmente un account (email/password o social login) — qualsiasi
   ruolo va bene, verrà sovrascritto.
2. Dal tuo computer (o da dove hai `DATABASE_URL` configurato verso il database
   giusto — locale o Neon), esegui:

   ```bash
   npm run admin:promote -- mario@esempio.it
   ```

   (equivalente a `npx tsx scripts/promote-admin.ts mario@esempio.it`)

3. Se quell'account aveva già una sessione aperta, deve **rifare il login**
   perché il nuovo ruolo diventi effettivo — al prossimo accesso viene mandato
   automaticamente su `/admin` invece che su `/dashboard`.

Per togliere i privilegi admin (torna a un account Allievo normale):

```bash
npm run admin:promote -- mario@esempio.it --revoke
```

## Cosa può fare un admin

- **Ticket di assistenza** (`/admin/tickets`): vede tutte le richieste aperte da
  PT/Allievi, può rispondere (il richiedente riceve una notifica) e cambiare lo
  stato (Aperto / In lavorazione / Chiuso).
- **Gestione utenze** (`/admin/users`): cerca per nome/email, filtra per ruolo,
  vede i dettagli di un account (schede create, allenamenti completati, trainer
  collegato, ecc.), può **disabilitare** un account (blocca il login e invalida
  la sessione attiva, senza cancellare nulla) o **eliminarlo** definitivamente
  (cancella anche schede, allenamenti, media e ticket collegati — azione non
  reversibile).
- **Accesso come un altro utente** (dalla scheda di un account in
  `/admin/users/<id>`, pulsante "Accedi come questo utente"): l'admin entra
  con i pieni permessi di quel PT o Allievo — dashboard, schede, allenamenti,
  tutto — per testare o verificare un problema segnalato. Mentre è attivo
  compare una barra in alto ("Stai visualizzando l'app come...") con un
  pulsante per tornare al pannello admin in un click. Non è possibile
  impersonare un altro admin, né un account disabilitato.
- **Collegamenti PT ↔ Allievo** (`/admin/links`): collega manualmente un
  Allievo a un Personal Trainer (utile se un codice invito non ha funzionato
  o serve assistenza), riassegna un allievo a un PT diverso, o rimuove un
  collegamento — entrambe le parti ricevono una notifica. La pagina evidenzia
  anche gli allievi che al momento non hanno nessun PT collegato.

Un account admin **non ha una propria dashboard PT/Allievo** — è un ruolo
separato, pensato solo per la gestione della piattaforma. Se serve continuare a
usare l'app anche come PT o Allievo, tieni un account normale separato da quello
admin.

## Nota

Un admin non può disabilitare o eliminare **il proprio** account dal pannello
(protezione per evitare di autoescludersi per errore) — serve un altro admin,
o lo stesso comando `promote-admin.ts --revoke` da terminale.

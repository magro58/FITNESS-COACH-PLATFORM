// Grants (or revokes) the ADMIN role for an existing account, identified by
// email. There is no UI or API path to create an admin — that's deliberate:
// admin access is security-sensitive, so it can only be granted by someone
// who already has direct database access (you, running this script).
//
// Usage (run from the project root, with the right DATABASE_URL in your
// environment / .env — same as `npm run db:seed`):
//
//   npx tsx scripts/promote-admin.ts mario@esempio.it
//   npx tsx scripts/promote-admin.ts mario@esempio.it --revoke

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const revoke = process.argv.includes("--revoke");

  if (!email) {
    console.error("Uso: npx tsx scripts/promote-admin.ts <email> [--revoke]");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`Nessun utente trovato con email "${email}". Deve essersi già registrato.`);
    process.exit(1);
  }

  if (revoke) {
    if (user.role !== "ADMIN") {
      console.log(`${email} non è admin, nessuna modifica necessaria.`);
      return;
    }
    await prisma.user.update({ where: { email }, data: { role: "STUDENT" } });
    console.log(`Rimossi i privilegi admin da ${email} (impostato a STUDENT).`);
    return;
  }

  if (user.role === "ADMIN") {
    console.log(`${email} è già admin, nessuna modifica necessaria.`);
    return;
  }

  await prisma.user.update({ where: { email }, data: { role: "ADMIN" } });
  console.log(`${email} è ora admin. Può accedere a /admin con le sue credenziali abituali.`);
}

main()
  .catch((err) => {
    console.error("Errore:", err.message ?? err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

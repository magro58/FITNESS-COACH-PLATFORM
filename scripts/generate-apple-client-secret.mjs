// Generates the ES256 JWT that "Sign in with Apple" requires as APPLE_CLIENT_SECRET
// (Apple does not accept a plain string like Google/Microsoft do).
//
// Usage:
//   node scripts/generate-apple-client-secret.mjs \
//     --team-id ABCDE12345 \
//     --client-id it.tuodominio.fitnesscoach.signin \
//     --key-id ABC123XYZ9 \
//     --key-file /path/to/AuthKey_ABC123XYZ9.p8
//
// Run this on your own machine (not in this sandbox) with the .p8 file you
// downloaded once from the Apple Developer portal — Apple only lets you
// download it once, so keep it somewhere safe. The generated JWT expires
// after at most 6 months and must be regenerated (same command) before then.

import { readFileSync } from "fs";
import { SignJWT, importPKCS8 } from "jose";

function arg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1 || !process.argv[idx + 1]) {
    throw new Error(`Missing required --${name} argument`);
  }
  return process.argv[idx + 1];
}

async function main() {
  const teamId = arg("team-id");
  const clientId = arg("client-id");
  const keyId = arg("key-id");
  const keyFile = arg("key-file");

  const privateKeyPem = readFileSync(keyFile, "utf-8");
  const privateKey = await importPKCS8(privateKeyPem, "ES256");

  const sixMonthsInSeconds = 15777000;

  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(teamId)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + sixMonthsInSeconds)
    .setAudience("https://appleid.apple.com")
    .setSubject(clientId)
    .sign(privateKey);

  console.log("\nAPPLE_CLIENT_SECRET (valid ~6 months, regenerate before it expires):\n");
  console.log(jwt);
  console.log("");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});

/**
 * Script de seed para ambiente local.
 * Cria o usuário admin e imprime o cookie de sessão JWT.
 *
 * Uso: npx tsx seed-local.ts
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { SignJWT } from "jose";

const DATABASE_URL = process.env.DATABASE_URL!;
const JWT_SECRET = process.env.JWT_SECRET!;
const APP_ID = process.env.VITE_APP_ID!;
const OWNER_OPEN_ID = process.env.OWNER_OPEN_ID!;

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL);

  // Insere o usuário admin (ignora se já existir)
  await conn.execute(
    `INSERT IGNORE INTO users (openId, name, email, role, lastSignedIn, createdAt, updatedAt)
     VALUES (?, 'Admin Local', 'admin@local.dev', 'admin', NOW(), NOW(), NOW())`,
    [OWNER_OPEN_ID]
  );

  console.log(`✓ Usuário admin criado (openId: ${OWNER_OPEN_ID})`);

  // Gera JWT de sessão válido por 1 ano
  const secretKey = new TextEncoder().encode(JWT_SECRET);
  const expiresAt = Math.floor((Date.now() + 365 * 24 * 60 * 60 * 1000) / 1000);

  const token = await new SignJWT({
    openId: OWNER_OPEN_ID,
    appId: APP_ID,
    name: "Admin Local",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expiresAt)
    .sign(secretKey);

  console.log("\n========== COOKIE DE SESSÃO ==========");
  console.log("Nome do cookie: session");
  console.log("Valor:");
  console.log(token);
  console.log("======================================\n");
  console.log("Cole esse valor no DevTools do browser:");
  console.log(`document.cookie = "session=${token}; path=/"`);

  await conn.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

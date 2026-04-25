import postgres from "postgres";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(__dirname, "..", "supabase", "migrations", "20260425000000_renumber_contracts.sql");
const sql = readFileSync(sqlPath, "utf8");

const url = process.env.DATABASE_URL || "postgresql://postgres.nfjyjnvmorwhikhczplp:CNTteqllkjcCXkkA@aws-1-us-east-1.pooler.supabase.com:6543/postgres";

const client = postgres(url, { prepare: false });

try {
  console.log("Aplicando migração de renumeração...");
  await client.unsafe(sql);

  const sample = await client`
    SELECT "userId", "contractNumber", "createdAt"
    FROM sysjuros."contracts"
    ORDER BY "userId", "createdAt"
    LIMIT 20
  `;
  console.log("Amostra após renumeração:");
  console.table(sample);

  console.log("✓ Migração aplicada com sucesso");
} catch (err) {
  console.error("✗ Erro:", err.message);
  process.exit(1);
} finally {
  await client.end();
}

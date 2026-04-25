-- Drop UNIQUE constraint global e renumera contratos por usuário
-- Formato novo: "#1", "#2", ... por usuário (ordem por createdAt)

ALTER TABLE sysjuros."contracts" DROP CONSTRAINT IF EXISTS "contracts_contractNumber_unique";
ALTER TABLE sysjuros."contracts" DROP CONSTRAINT IF EXISTS "contracts_contractNumber_key";

WITH numbered AS (
  SELECT
    id,
    '#' || ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY "createdAt", id) AS new_num
  FROM sysjuros."contracts"
)
UPDATE sysjuros."contracts" c
SET "contractNumber" = numbered.new_num
FROM numbered
WHERE c.id = numbered.id;

-- Index não-único por usuário (pra busca eficiente)
CREATE INDEX IF NOT EXISTS "contracts_user_number_idx"
  ON sysjuros."contracts" ("userId", "contractNumber");

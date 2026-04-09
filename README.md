# Conferencia Easy

Sistema SaaS de gestão de contratos e cobrança de juros.

## Funcionalidades

- Cadastro de clientes
- Contratos: fixo, parcelado e rotativo
- Geração automática de parcelas (contratos rotativos)
- Vencimentos e controle de parcelas pagas/pendentes/vencidas
- Dashboard com gráfico mensal
- Relatórios com exportação CSV
- Painel admin para gerenciar usuários
- PWA — pode ser instalado como app no Android e iOS

## Stack

- **Frontend:** React 19 + Vite + Tailwind CSS + Radix UI + Wouter
- **Backend:** Express + tRPC + Drizzle ORM
- **Banco:** PostgreSQL (Supabase, schema `sysjuros`)
- **Auth:** JWT + bcrypt (sem OAuth)
- **Deploy:** Vercel (serverless, Build Output API)

## Variáveis de ambiente (Vercel)

| Variável       | Descrição                          |
|----------------|------------------------------------|
| `DATABASE_URL` | Pooler Supabase (transaction mode) |
| `JWT_SECRET`   | Segredo para assinar tokens JWT    |

## Desenvolvimento local

```bash
pnpm install
# criar .env com DATABASE_URL e JWT_SECRET
pnpm dev
```

## Deploy

```bash
pnpm build   # gera .vercel/output/
vercel --prod
```

## Regras de negócio

- **Contrato rotativo:** gera 1 parcela ao criar; ao marcar como paga, a próxima é gerada automaticamente
- **Contrato parcelado:** `(valor / n) * (1 + taxa/100)` por parcela
- **Contrato fixo:** parcelas inseridas manualmente
- Cada usuário vê apenas seus próprios dados (multi-tenant por `userId`)
- Apenas admin pode acessar `/admin/users`

## Produção

`https://sysjuros-clone.vercel.app`

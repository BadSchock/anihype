# AniHype — Configurar o banco (PostgreSQL + Prisma)

Você **não precisa** colar SQL manualmente no pgAdmin. O Prisma lê o `DATABASE_URL` e aplica as migrations sozinho.

## Pré-requisitos

1. **PostgreSQL** instalado (ex.: PostgreSQL 17, como no pgAdmin).
2. Banco **vazio** criado — só o nome, sem tabelas. No pgAdmin: botão direito em *Databases* → *Create* → *Database* → nome: `anihype`.
3. Node.js 18+ e dependências do monorepo: na raiz do projeto, `npm install`.

## 1. Configurar `.env` da API

Copie o exemplo e edite com **seu** usuário, senha e nome do banco:

```bash
cd apps/api
copy .env.example .env
```

No `.env`, a linha mais importante:

```env
DATABASE_URL=postgresql://USUARIO:SENHA@localhost:5432/anihype
```

**Senha com caracteres especiais** (`$`, `@`, `#`, etc.): use URL encoding na senha dentro da URL.

| Caractere | Na URL |
|-----------|--------|
| `$`       | `%24`  |
| `@`       | `%40`  |
| `#`       | `%23`  |

Exemplo: senha `Lucimar1$` → `Lucimar1%24`

Preencha também `JWT_SECRET` e `REFRESH_TOKEN_SECRET` (mínimo 16 caracteres cada).

## 2. Um comando — tabelas + dados iniciais

Na **raiz** do monorepo:

```bash
npm run db:setup
```

Isso executa, em ordem:

1. `prisma generate` — gera o client TypeScript  
2. `prisma migrate deploy` — aplica **todas** as migrations em `apps/api/prisma/migrations/` no banco conectado  
3. `prisma db seed` — insere roles, badges e níveis hype iniciais  

Equivalente dentro de `apps/api`:

```bash
cd apps/api
npm run db:setup
```

## 3. Conferir

- API: `cd apps/api` → `npm run dev` → abrir `http://localhost:3001/api/v1/health` (campo `checks.database` deve ser `ok`).
- Opcional: `npm run db:studio -w @anihype/api` — interface visual do Prisma no navegador.

---

## Comandos úteis (referência)

| Comando (raiz) | O que faz |
|----------------|-----------|
| `npm run db:setup` | generate + migrate + seed (primeira vez / novo clone) |
| `npm run db:migrate` | só aplica migrations pendentes |
| `npm run db:seed` | só roda o seed de novo |

| Comando (`apps/api`) | Quando usar |
|----------------------|-------------|
| `npm run db:migrate` (`migrate dev`) | **Desenvolvedor** criando **nova** migration após mudar `schema.prisma` |
| `npm run db:migrate-deploy` | Produção ou time aplicando migrations já commitadas |
| `npm run db:push` | *(não configurado)* evitar em time — não versiona histórico |

---

## Fluxo para quem clona o repositório

1. `git clone` …  
2. `npm install` (raiz)  
3. Criar banco `anihype` no Postgres (pgAdmin ou `CREATE DATABASE anihype;`)  
4. `apps/api/.env` com `DATABASE_URL` correto  
5. `npm run db:setup`  
6. `npm run dev` (ou `cd apps/api && npm run dev`)

Não é necessário Docker nem colar `migration.sql` no pgAdmin — as migrations já estão versionadas no Git em `apps/api/prisma/migrations/`.

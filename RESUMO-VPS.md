# AniHype — Resumo para deploy na VPS

Guia rápido: linguagens, arquitetura e o essencial para subir o projeto em produção.

---

## Linguagem e stack

| Item | Tecnologia |
|------|------------|
| **Linguagem** | **TypeScript** em todo o projeto |
| **Runtime** | **Node.js 18+** |
| **Gerenciador** | npm workspaces + **Turborepo** |
| **Banco** | **PostgreSQL** + **Prisma ORM** |
| **Frontend** | **Next.js 15** (App Router), React 18, TailwindCSS |
| **Backend** | **NestJS 10** (REST API) |
| **Auth** | JWT + refresh tokens (Passport) |
| **Estado no front** | TanStack Query + Zustand |
| **APIs externas** | AniList + Jikan (só o backend chama) |

---

## Arquitetura (visão geral)

```
                    ┌─────────────────────────────────────┐
                    │           VPS (Linux)               │
                    │                                     │
  Usuário ──HTTPS──►│  Nginx (reverse proxy)              │
                    │    ├─► Web  Next.js  :3002          │
                    │    └─► API  NestJS   :3001          │
                    │              │                      │
                    │              ▼                      │
                    │         PostgreSQL :5432            │
                    └─────────────────────────────────────┘
                              │
                              ▼ (sync/cron)
                    AniList API  ·  Jikan API
```

**Regra importante:** o frontend **nunca** chama AniList/Jikan. Fluxo: `API externa → SyncService (backend) → PostgreSQL → Frontend`.

---

## Estrutura do monorepo

```
AniHype/
├── apps/
│   ├── web/          → Frontend (Next.js) — porta local 3002
│   └── api/          → Backend (NestJS) — porta local 3001, prefixo /api/v1
├── packages/
│   ├── types/        → Tipos TS compartilhados
│   ├── config/       → Constantes (rotas, roles)
│   ├── ui/           → Utilitários de UI
│   ├── tsconfig/     → Configs TypeScript
│   └── eslint-config/
├── docker-compose.yml → Só Postgres (+ pgAdmin opcional)
└── package.json       → Scripts: dev, build, db:setup, db:migrate
```

---

## Frontend (`apps/web`)

| Aspecto | Detalhe |
|---------|---------|
| Framework | Next.js 15 App Router |
| Código | `apps/web/src/` (`app/`, `components/`, `hooks/`, `services/`) |
| Porta dev | **3002** |
| Porta prod | `next start` (padrão 3000; use `-p 3002` para manter padrão do projeto) |
| Build | `npm run build -w @anihype/web` |
| Estilo | TailwindCSS + Radix UI |
| Dados | `fetch` via `api-client.ts` → API REST |

**Páginas principais:** home, `/anime`, `/calendar`, `/feed`, `/login`, `/register`, `/u/[username]`, `/admin`.

---

## Backend (`apps/api`)

| Aspecto | Detalhe |
|---------|---------|
| Framework | NestJS 10 |
| Código | `apps/api/src/modules/` (auth, anime, episodes, comments, ratings, sync, feed, notifications…) |
| Porta | **3001** |
| Prefixo | **`/api/v1`** |
| Build | `prisma generate` + `tsc` → roda com `node dist/main` |
| Docs | Swagger em `/api/docs` (só fora de `production`) |
| Health | `GET /api/v1/health` |

**Módulos:** Auth, Users, Anime, Episodes, Comments, Ratings, Sync (AniList/Jikan), Highlights, Feed, Notifications, Hype XP, Admin.

**Cron automático:** sync diário (04:00 BRT) e semanal (domingo 03:00 BRT).

---

## Banco de dados

| Aspecto | Detalhe |
|---------|---------|
| Engine | PostgreSQL |
| Schema | `apps/api/prisma/schema.prisma` |
| Migrations | `apps/api/prisma/migrations/` (versionadas no Git) |
| Setup inicial | `npm run db:setup` (generate + migrate + seed) |
| Só migrations | `npm run db:migrate` |

**Docker local (opcional):** `docker compose up -d` sobe Postgres. pgAdmin: `docker compose --profile tools up -d`.

---

## Variáveis de ambiente

### API — `apps/api/.env`

```env
NODE_ENV=production
PORT=3001

DATABASE_URL=postgresql://USUARIO:SENHA@localhost:5432/anihype

JWT_SECRET=chave-secreta-min-16-chars
REFRESH_TOKEN_SECRET=outra-chave-min-16-chars

CORS_ORIGIN=https://seudominio.com

ANILIST_API_URL=https://graphql.anilist.co
JIKAN_API_URL=https://api.jikan.moe/v4
```

> Senha com `$`, `@`, `#` na `DATABASE_URL`: use URL encoding (`$` → `%24`).

### Web — `apps/web/.env.local` (ou `.env.production`)

```env
NEXT_PUBLIC_API_URL=https://api.seudominio.com/api/v1
NEXT_PUBLIC_APP_URL=https://seudominio.com
```

> `CORS_ORIGIN` da API deve ser **exatamente** a URL do frontend (`NEXT_PUBLIC_APP_URL`).

---

## Deploy na VPS (passo a passo)

### 1. Pré-requisitos na VPS

- Ubuntu/Debian (ou similar)
- Node.js 18+
- PostgreSQL (instalado ou via Docker)
- Nginx + Certbot (HTTPS)
- PM2 ou systemd (manter processos rodando)

### 2. Clonar e instalar

```bash
git clone <repo> anihype
cd anihype
npm install
```

### 3. Banco

```bash
# Criar banco vazio "anihype" no Postgres
# Configurar apps/api/.env com DATABASE_URL
npm run db:setup    # primeira vez
# Depois, só: npm run db:migrate
```

### 4. Build de produção

```bash
npm run build
```

### 5. Subir os serviços

**API:**

```bash
cd apps/api
npm run start
# ou: node dist/main
```

**Web:**

```bash
cd apps/web
npm run start -- -p 3002
```

**Com PM2 (exemplo):**

```bash
pm2 start apps/api/dist/main.js --name anihype-api
pm2 start npm --name anihype-web --cwd apps/web -- start -- -p 3002
pm2 save
```

### 6. Nginx (reverse proxy)

Exemplo simplificado:

```nginx
# Frontend
server {
    listen 443 ssl;
    server_name seudominio.com;
    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}

# API
server {
    listen 443 ssl;
    server_name api.seudominio.com;
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 7. Sync inicial de dados (animes)

Após API rodando:

```bash
npm run sync:season -w @anihype/api
# ou via admin / endpoint de sync (se configurado)
```

---

## Portas e URLs (referência)

| Serviço | Porta local | URL exemplo |
|---------|-------------|-------------|
| Frontend | 3002 | `https://seudominio.com` |
| API | 3001 | `https://api.seudominio.com/api/v1` |
| Health | 3001 | `/api/v1/health` |
| Postgres | 5432 | interno (não expor na internet) |

---

## Comandos úteis

| Comando (raiz) | Função |
|----------------|--------|
| `npm run dev` | Dev: web + api |
| `npm run build` | Build de tudo |
| `npm run db:setup` | Banco: migrations + seed |
| `npm run db:migrate` | Só migrations |
| `npm run sync:season` | Sync temporada AniList |

---

## Checklist antes de ir ao ar

- [ ] `NODE_ENV=production` na API
- [ ] `JWT_SECRET` e `REFRESH_TOKEN_SECRET` fortes e únicos
- [ ] `CORS_ORIGIN` = URL real do frontend
- [ ] `NEXT_PUBLIC_API_URL` e `NEXT_PUBLIC_APP_URL` com HTTPS
- [ ] Migrations aplicadas (`npm run db:migrate`)
- [ ] Postgres com backup configurado
- [ ] Nginx + SSL (Let's Encrypt)
- [ ] PM2/systemd para reinício automático
- [ ] Sync de temporada executado (dados de anime)

---

## Documentação extra no repo

- `README.md` — começar rápido local
- `SETUP-BANCO.md` — Postgres + Prisma em detalhe
- `ESTADO-DO-PROJETO.md` — o que está implementado hoje

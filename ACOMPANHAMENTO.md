# AniHype — Acompanhamento do desenvolvimento

Este documento registra o que já foi implementado no projeto, referência ao guia oficial (`anihype_v1_cursor_implementation_guide.md`) e onde paramos. **Atualize este arquivo** a cada etapa concluída ou decisão relevante.

---

## Visão geral

| Item | Status |
|------|--------|
| **Etapa 1** — Setup do Monorepo | Concluída |
| **Etapa 2** — Setup do Backend | Concluída |
| **Etapa 3** — Schema Prisma completo | Não iniciada |
| Push para GitHub (`origin main`) | Commit e remote OK; push SSH falhou neste ambiente (ver § Git) |

---

## Etapa 1 — Setup do Monorepo (concluída)

Objetivo do guia: Turborepo, `apps/web`, `apps/api`, pacotes em `packages/`, ESLint, Prettier, TypeScript strict, workspace funcionando.

### O que foi criado

- **Raiz**
  - `package.json` — workspaces `apps/*` e `packages/*`, scripts `build`, `dev`, `lint`, `format`, `type-check`
  - `turbo.json` — tarefas Turbo (`build`, `dev`, `lint`, `type-check`, `clean`)
  - `.prettierrc`, `.prettierignore`, `.editorconfig`, `.gitignore`
  - `.env.example` — variáveis para Docker / Postgres (raiz)

- **`apps/web`** — Next.js (App Router), TypeScript, Tailwind, deps alinhadas ao guia (TanStack Query, Zod, Framer Motion, Radix para shadcn, etc.)
  - Estrutura `src/`: `app/`, `components/ui/`, `features/*`, `hooks/`, `services/`, `stores/`, `lib/`, `types/`, `utils/`, `styles/`, `providers/`
  - Página inicial mínima (placeholder), sem telas de produto
  - `next.config.ts`, `tailwind.config.ts`, `postcss.config.js`

- **`apps/api`** — NestJS inicial (antes da Etapa 2 completa já existia esqueleto)
  - Estrutura `src/` com pastas para módulos futuros e `common`

- **`packages/`**
  - `tsconfig/` — `base.json`, `nextjs.json`, `nestjs.json`
  - `eslint-config/` — `base.js`, `next.js`, `nest.js`
  - `config/` — constantes compartilhadas (rotas API, roles, paginação, hype XP)
  - `types/` — tipos TS (user, anime, episode, comment)
  - `ui/` — utilitário `cn()` (tailwind-merge + clsx)

### Ajustes técnicos relevantes (Etapa 1)

- Next.js atualizado para **v15** para compatibilidade com **ESLint 9** (`eslint-config-next@14` pedia ESLint 7/8).
- `packages/tsconfig/nestjs.json` com `moduleResolution: "node"` para não conflitar com `commonjs` do Nest.
- Prisma: schema **placeholder** (`SetupCheck`) só para gerar client até a Etapa 3.

### Scripts úteis (raiz)

```bash
npm install
npm run dev      # sobe web + api via Turbo (quando ambos tiverem script dev)
npm run build
npm run lint
```

---

## Etapa 2 — Setup do Backend (concluída)

Objetivo do guia: NestJS, Prisma, PostgreSQL, Docker Compose, validação de env, ConfigModule, PrismaModule, logger, ValidationPipe global, exception filter global, `common` organizado; API sobe, banco conecta, Prisma funciona, health check responde.

### O que foi adicionado ou alterado

- **`docker-compose.yml`** (raiz)
  - Serviço `postgres` (PostgreSQL 16 Alpine), volume, healthcheck
  - `pgadmin` opcional com profile `tools`

- **`apps/api` — Configuração**
  - `src/config/env.validation.ts` — validação com **Zod** na subida (`validate` no `ConfigModule`)
  - `src/config/app.config.ts` — `app`, `database`, `jwt`, `providers` via `registerAs`
  - `apps/api/.env.example` — template (o `.env` local **não** vai para o Git)

- **`apps/api` — Common**
  - `common/filters/http-exception.filter.ts` — filtro global de exceções (JSON padronizado)
  - `common/interceptors/transform.interceptor.ts` — envelope `{ data, timestamp }` + log de latência
  - `common/decorators/` — `@CurrentUser`, `@Roles`, `@Public`, helper Swagger paginado
  - `common/guards/roles.guard.ts`
  - `common/pipes/zod-validation.pipe.ts`
  - `common/dto/pagination.dto.ts` + `paginate()`
  - `common/logger/app-logger.service.ts` — logger customizado (cores no terminal)

- **`apps/api` — App**
  - `AppModule`: `ConfigModule.forRoot` com validação e `load` dos configs, Throttler, `APP_FILTER` + `APP_INTERCEPTOR` globais
  - `main.ts`: CORS, prefixo `api/v1`, ValidationPipe global, Swagger fora de produção, `AppLogger`
  - **Build**: script `"build": "tsc --project tsconfig.build.json"` e `outDir: ./dist` no `tsconfig` da API (output consistente em `apps/api/dist`)

- **Health**
  - `modules/health`: controller + service com `PrismaService.$queryRaw\`SELECT 1\`` — status `ok` / `degraded` conforme banco
  - Rota: `GET /api/v1/health`

### Prisma nesta etapa

- `apps/api/prisma/schema.prisma` ainda é **mínimo** (model placeholder até a Etapa 3).
- `npx prisma generate` foi usado para ter `@prisma/client` compilando.

### Onde paramos (limite da Etapa 2)

- Não foi feito o **schema completo** nem **migrations** reais — isso é **Etapa 3**.
- **Docker** no ambiente onde o assistente rodou: comando `docker` não estava disponível; o compose está pronto para uso local com Docker Desktop.
- **Push GitHub**: `git push` via SSH retornou `Permission denied (publickey)`; commit em `main` e `origin` configurados localmente (resolver SSH ou usar HTTPS no seu PC).

---

## Git — estado registrado (última sessão)

- Repositório inicializado na raiz do projeto.
- **Commit:** `29abae2` — `feat: monorepo AniHype — etapas 1 e 2 (Turborepo, web, api, packages, Docker, backend base)`
- **Remote:** `origin` → `git@github.com:BadSchock/anihype.git`
- **Branch:** `main`
- **Push:** executar na sua máquina após configurar chave SSH ou trocar o remote para HTTPS.

---

## Próximo passo sugerido (Etapa 3)

Conforme o guia:

- Schema Prisma completo (tabelas principais: users, roles, anime, episodes, comments, etc.).
- Migrations, seeds (roles, badges iniciais), índices e relações.
- Ajustar `.gitignore` se necessário para não ignorar pastas de migration incorretamente (hoje há uma regra em `.gitignore` sobre `prisma/migrations/**/migration.sql` — revisar na Etapa 3).

---

## Como rodar localmente (resumo)

1. **Subir Postgres** (com Docker instalado):  
   `docker compose up -d postgres`

2. **Configurar `apps/api/.env`** (copiar de `apps/api/.env.example` e preencher `DATABASE_URL`, secrets JWT, etc.).

3. **API em desenvolvimento:**  
   `cd apps/api` → `npx nest start --watch`  
   - Health: `http://localhost:3001/api/v1/health`  
   - Swagger (não-prod): `http://localhost:3001/api/docs`

4. **Web:**  
   `cd apps/web` → copiar `.env.example` para `.env.local` → `npm run dev` (porta 3000).

---

## Histórico de atualizações deste arquivo

| Data | Alteração |
|------|-----------|
| *Preencher ao atualizar* | Criação do documento com Etapas 1 e 2 concluídas e pendências (Etapa 3, push). |

---

*Última revisão do conteúdo: conforme sessão que documentou monorepo + backend base até antes da Etapa 3.*

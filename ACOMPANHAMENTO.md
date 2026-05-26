# AniHype — Acompanhamento do desenvolvimento

Este documento registra o que já foi implementado no projeto, referência ao guia oficial (`anihype_v1_cursor_implementation_guide.md`) e onde paramos. **Atualize este arquivo** a cada etapa concluída ou decisão relevante.

---

## Visão geral

| Item | Status |
|------|--------|
| **Etapa 1** — Setup do Monorepo | Concluída |
| **Etapa 2** — Setup do Backend | Concluída |
| **Etapa 3** — Schema Prisma completo | Concluída |
| **Etapa 4** — Auth (register / login / logout / refresh / me) | Concluída |
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
- Schema Prisma completo ficou para a **Etapa 3** (ver mais abaixo).

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

### Prisma nesta etapa (Etapa 2)

- Bootstrap com schema mínimo; o modelo de dados definitivo está na **Etapa 3**.

### Onde paramos após Etapa 2 (histórico)

- Antes da Etapa 3, faltava o **schema completo** — agora tratado na seção Etapa 3.
- **Docker** no ambiente onde o assistente rodou: comando `docker` não estava disponível; o compose está pronto para uso local com Docker Desktop.
- **Push GitHub**: `git push` via SSH retornou `Permission denied (publickey)`; commit em `main` e `origin` configurados localmente (resolver SSH ou usar HTTPS no seu PC).

---

## Etapa 3 — Schema Prisma completo (concluída)

Objetivo do guia: schema com todas as tabelas principais, `snake_case` no banco, IDs inteiros, timestamps, soft delete onde cabe; migrations; seeds de roles e badges iniciais; índices e FKs.

### O que foi feito

- **`apps/api/prisma/schema.prisma`**
  - Enums Postgres alinhados a status de anime, episódio, comentários, reports, hype, billing, etc.
  - Tabelas: `users`, `roles`, `user_roles`, `refresh_tokens`, `password_reset_tokens`, `email_verification_tokens`, `anime`, `episodes`, `genres`, `studios`, junções (`anime_genres`, `anime_studios`, …), `seasonal_highlights`, IDs externos de anime, imagens extras, streaming, `comments`, `comment_likes`, `comment_reports`, `reports`, `spoiler_settings`, follows, `user_profiles`, `user_activity`, badges e hype, premium, ads, notificações, auditoria/moderação (`admin_logs`, `moderation_logs`).
  - `username` / slugs com `VARCHAR` (sem extensão `citext`; case-sensitive no Postgres — normalizar lowercase na aplicação se quiser igual ao guia tipo citext).

- **Migration inicial**
  - Pasta `apps/api/prisma/migrations/20260526120000_init_full_schema/migration.sql` gerada via `prisma migrate diff --from-empty` (não precisa de DB só para gerar o SQL).

- **Seeds (`apps/api/prisma/seed.ts`)**
  - Roles: `USER`, `PREMIUM`, `MODERATOR`, `ADMIN`, `SUPER_ADMIN`.
  - Badges iniciais: `beta-user`, `founder`, `admin`, `moderator`.
  - Curva inicial de níveis hype (`hype_levels`).

- **Scripts no `apps/api/package.json`**
  - `db:generate`, `db:migrate`, `db:migrate-deploy`, `db:seed`, `db:studio`.
  - `prisma.seed` apontando para `ts-node` → `prisma/seed.ts`.

- **`.gitignore`**
  - Removida regra incorreta que ignorava `prisma/migrations/**/migration.sql` (migrations devem ir para o Git).

- **Observações**
  - `schema.prisma` deve ser guardado **sem BOM** no início do arquivo para o CLI do Prisma validar direito (evitar `.ps1 Set-Content` com BOM sobre o schema).

### Como aplicar migrations e seed na sua máquina

(subir Postgres primeiro, por exemplo `docker compose up -d postgres`)

```bash
cd apps/api
copy .env.example .env   # ou ajuste DATABASE_URL no .env já existente
npx prisma migrate deploy    # ou: npx prisma migrate dev
npm run db:seed
```

### Resultado esperado

- Projeto valida (`prisma validate` com `DATABASE_URL` definido).
- `prisma generate` e `npm run type-check` no `apps/api` sem erros.
- Com DB ativo + migrate + seed: health check deve continuar `'ok'` no banco.

---

## Git — estado registrado (última sessão)

- Repositório inicializado na raiz do projeto.
- **Commit:** `29abae2` — `feat: monorepo AniHype — etapas 1 e 2 (Turborepo, web, api, packages, Docker, backend base)`
- **Remote:** `origin` → `git@github.com:BadSchock/anihype.git`
- **Branch:** `main`
- **Push:** executar na sua máquina após configurar chave SSH ou trocar o remote para HTTPS.

---

## Etapa 4 — Auth (concluída)

Objetivo do guia: register, login, logout, refresh, guards, roles, current user, hash de senha, refresh tokens persistidos.

### O que foi criado

- **`modules/users/`** — `UsersRepository` (Prisma), `UsersService` (create, findById/Email/Username, findWithRoles, updateLastLogin), `UsersModule`
- **`modules/auth/dto/`** — `RegisterDto`, `LoginDto`, `RefreshTokenDto` (com class-validator)
- **`modules/auth/auth.service.ts`** — register (bcrypt hash + role USER + cria perfil), login (email **ou** username), logout (revoga todos os refresh tokens), refresh (token rotation — revoga token usado e emite novo par), getMe, validateJwtPayload
- **`modules/auth/strategies/jwt.strategy.ts`** — `PassportStrategy` que valida payload via `AuthService`
- **`modules/auth/guards/jwt-auth.guard.ts`** — guarda que respeita `@Public()` (rota aberta) via `Reflector`
- **`modules/auth/auth.controller.ts`** — `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`; throttle em register (5/min) e login/refresh (10/min)
- **`modules/auth/auth.module.ts`** — JwtModule async via ConfigService, PassportModule, exports de AuthService e JwtAuthGuard
- **`app.module.ts`** — guards globais via `APP_GUARD`: `ThrottlerGuard` → `JwtAuthGuard` → `RolesGuard`; rota `/health` marcada com `@Public()`

### Notas técnicas
- Refresh token é um token **opaco** (hex 128 chars), armazenado com hash bcrypt no banco — não um JWT.
- No endpoint `/auth/refresh` o cliente envia `{ userId, refreshToken }`.
- Token rotation ativa: um refresh token só pode ser usado uma vez; tentativa dupla revoga todos os tokens do usuário.
- `@Public()` desabilita o `JwtAuthGuard` para rotas públicas.

## Próximo passo sugerido (Etapa 5)

Conforme o guia: **AnimeModule** — AnimeService, AnimeRepository, endpoints públicos (listar, buscar, detalhe por ID+slug), paginação, filtros básicos, DTOs.

---

## Como rodar localmente (resumo)

1. **Subir Postgres** (com Docker instalado):  
   `docker compose up -d postgres`

2. **Configurar `apps/api/.env`** (copiar de `apps/api/.env.example`). Com DB pronto:  
   `npm run db:migrate-deploy` ou `npx prisma migrate dev` e `npm run db:seed` dentro de `apps/api`.

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
| Etapa seguinte ao guia | **Etapa 3** registrada como concluída (schema, migration inicial, seed, `.gitignore`). |
| Sessão atual | **Etapa 4 — Auth** concluída (UsersModule, AuthService, strategies, guards globais, controller, token rotation). Próxima: **Etapa 5 — AnimeModule**. |

---

*Última revisão: Etapas 1–3 documentadas; próximo passo lógico Etapa 4 (Auth).*

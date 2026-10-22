> **Documento antigo.** Parte do que está aqui já mudou. O estado real do projeto está em [ESTADO-ATUAL.md](./ESTADO-ATUAL.md).

# AniHype — Planejamento de Desenvolvimento

> **Última atualização:** 18/06/2026 22:21 (BRT)
>
> Este documento foi escrito para o time de 3 devs entender o estado atual do projeto, o que cada parte faz, o que ainda precisa ser construído e como dividir o trabalho sem conflito.

---

## Visão do produto

O **AniHype** é a plataforma brasileira de anime sazonal com alma de rede social.

A referência conceitual é o **Letterboxd** — mas para anime, em português, com foco no hype semanal de episódios. Não é um banco de dados como AniList/MAL. É uma comunidade com identidade própria.

**O que queremos que o usuário sinta:**
> *"Esse site está vivo. Tem gente aqui."*

**O que diferencia o AniHype:**
- Pentagon Score — sistema de nota próprio com 5 critérios
- Hype XP — reputação ganho por participar da comunidade
- Episódio como coração da discussão semanal
- Feed social de quem você segue
- Visual cinematográfico, mobile-first, sem poluição

---

## Stack e linguagens

| O que é | Tecnologia | Linguagem |
|---|---|---|
| Monorepo | Turborepo + npm workspaces | — |
| API (backend) | NestJS 10 | TypeScript |
| Banco de dados | PostgreSQL | SQL via Prisma ORM |
| Frontend | Next.js 15 (App Router) | TypeScript + TSX |
| Estilos | TailwindCSS | CSS utility |
| Estado global | Zustand | TypeScript |
| Requisições | TanStack React Query | TypeScript |
| Auth | JWT (15min) + Refresh Token (7d) | — |
| Dados externos | AniList GraphQL + Jikan REST | — |

### Onde cada coisa vive

```
anihype/
├── apps/
│   ├── api/                    ← NestJS — toda a lógica de negócio e banco
│   │   ├── prisma/
│   │   │   └── schema.prisma   ← Schema completo do banco
│   │   └── src/
│   │       ├── modules/        ← Um módulo por feature (auth, anime, comments...)
│   │       ├── common/         ← Guards, decorators, filtros globais
│   │       └── config/         ← Variáveis de ambiente tipadas
│   └── web/                    ← Next.js — toda a interface
│       └── src/
│           ├── app/            ← Páginas (App Router do Next.js 15)
│           ├── components/     ← Componentes reutilizáveis
│           ├── hooks/          ← Hooks React Query (use-*.ts)
│           ├── services/       ← Funções que chamam a API (api.ts)
│           ├── stores/         ← Estado global Zustand
│           ├── types/          ← Tipos TypeScript espelhados da API
│           └── lib/            ← Utilitários (datas BRT, URLs, etc.)
└── packages/
    └── ui/                     ← Componentes base compartilhados
```

---

## Regra de ouro (não quebrar nunca)

> O frontend **nunca** chama AniList ou Jikan diretamente.

```
AniList / Jikan  →  SyncService (API)  →  PostgreSQL  →  Frontend
```

Todo dado de anime passa pelo nosso banco. Isso garante performance, controle e independência.

---

## O que já está pronto hoje

### Backend — módulos implementados

| Módulo | O que faz | Arquivos |
|---|---|---|
| `auth` | Register, login, refresh token, logout, /me | `auth/` |
| `users` | Perfil público por username | `users/` |
| `user-follow` | Seguir/deixar de seguir usuários + contadores | `user-follow/` |
| `anime` | Listar, filtrar, buscar, detalhe com streaming links | `anime/` |
| `anime-follow` | Seguir anime + listagem no perfil | `anime-follow/` |
| `anime-admin` | Editar capa, banner, trailer, streaming, horários + `isLocked` | `anime-admin/` |
| `episodes` | Today, calendar, recent, trending, por anime + commentCount | `episodes/` |
| `comments` | CRUD + like + spoiler + replies + hot comments | `comments/` |
| `ratings` | Pentagon Score — CRUD + cache agregado + review destaque | `ratings/` |
| `top-anime` | Top 4 animes favoritos por perfil | `top-anime/` |
| `highlights` | Destaque hero da home (admin-managed) | `highlights/` |
| `hype` | Hype XP por atividade (comentar, like, rating, follow) | `hype/` |
| `feed` | Feed de atividade de quem o usuário segue | `feed/` |
| `notifications` | Notificações in-app + unread count + marcar lida | `notifications/` |
| `sync` | Sync AniList/Jikan + cron diário/semanal | `sync/` |

### Frontend — páginas implementadas

| Página | URL | O que tem |
|---|---|---|
| Home | `/` | Hero, lançamentos hoje, comunidade em alta, review destaque, trending |
| Catálogo | `/anime` | Grid + filtros + busca com debounce |
| Anime | `/anime/[slug]` | Banner, episódios, ratings, onde assistir, trailer, seguir |
| Episódio | `/anime/[slug]/ep/[number]` | Hero, comentários, navegação, onde assistir |
| Calendário | `/calendar` | Grade dos próximos 7 dias |
| Feed | `/feed` | Atividade de quem você segue (requer login) |
| Perfil | `/u/[username]` | Avatar, bio, Top 4, Hype XP, seguidores, atividade |
| Login / Cadastro | `/login`, `/register` | Com returnUrl |
| Admin | `/admin` | Sync, cron, highlights, editor de anime |

### Banco de dados — modelos existentes

```
users               → dados do usuário
user_roles          → permissões (USER, PREMIUM, MODERATOR, ADMIN, SUPER_ADMIN)
user_profiles       → hype_xp, hype_level, badge equipado
user_follows        → quem segue quem
user_top_anime      → Top 4 de cada usuário
user_activity       → log de ações do usuário
user_badges         → badges conquistados

anime               → dados principais do anime + cache de ratings + isLocked
episodes            → episódios com status (AIRED / UPCOMING / UNKNOWN)
anime_genres        → relação anime ↔ gênero
anime_studios       → relação anime ↔ estúdio
anime_external_ids  → IDs do AniList, MAL, etc.
anime_streaming_platforms → links de onde assistir
anime_images        → galeria de imagens
seasonal_highlights → destaque hero da home

comments            → comentários com thread (parentId)
comment_likes       → likes em comentários
anime_ratings       → Pentagon Score por usuário+anime
anime_follows       → seguir anime com flag notifyOnEpisode

hype_levels         → níveis de XP (tier, min_xp, displayName)
hype_transactions   → histórico de XP ganho/perdido
badges              → badges disponíveis na plataforma

notifications       → notificações in-app
notification_preferences → preferências de mute

refresh_tokens      → sessões ativas
```

---

## Separação do projeto em domínios independentes

Abaixo estão os **6 domínios** do projeto. Cada domínio pode ser desenvolvido de forma relativamente independente — ideal para dividir entre o time.

---

### Domínio 1 — Usuário & Perfil

**O que é:** tudo relacionado à conta, identidade e perfil do usuário.

**Estado atual:**
- ✅ Cadastro, login, sessão com refresh token
- ✅ Perfil público com avatar, bio, Top 4, Hype XP, seguidores, atividade
- ✅ Seguir/deixar de seguir outros usuários
- ⬜ Editar perfil próprio (bio, displayName, avatar)
- ⬜ Upload de avatar (precisa de storage externo: Cloudflare R2 ou S3)
- ⬜ OAuth (Google, Discord) — modelos já existem no banco
- ⬜ Verificação de e-mail — modelos já existem no banco

**Arquivos relevantes:**
```
apps/api/src/modules/auth/
apps/api/src/modules/users/
apps/api/src/modules/user-follow/
apps/web/src/app/login/
apps/web/src/app/register/
apps/web/src/app/u/[username]/
apps/web/src/stores/auth.store.ts
apps/web/src/providers/auth-provider.tsx
```

**Próximos passos para este domínio:**
1. `PATCH /users/me` — endpoint de edição (bio, displayName, avatarUrl)
2. Upload de avatar: integrar Cloudflare R2 ou S3 (`POST /users/me/avatar`)
3. Página `/configuracoes` ou modal de edição de perfil no frontend
4. OAuth Google/Discord (baixa prioridade, modelos prontos no banco)

---

### Domínio 2 — Anime & Episódios

**O que é:** dados de anime, episódios, sincronização com APIs externas e admin.

**Estado atual:**
- ✅ Listar, filtrar, buscar, detalhe por slug
- ✅ Streaming links por anime
- ✅ Episódios: today, calendar, recent, trending, por anime
- ✅ Admin editor: capa, banner, trailer, streaming, horários de episódio
- ✅ `isLocked` — protege edições manuais do sync automático
- ✅ Sync AniList/Jikan + cron diário/semanal
- ⬜ Página de ranking de animes (`/ranking`)
- ⬜ Busca global (anime + usuário em um único endpoint)
- ⬜ Filtro por gênero na página de catálogo
- ⬜ Watchlist ("quero assistir") separado de "seguindo"

**Arquivos relevantes:**
```
apps/api/src/modules/anime/
apps/api/src/modules/episodes/
apps/api/src/modules/anime-admin/
apps/api/src/modules/anime-follow/
apps/api/src/modules/sync/
apps/api/prisma/schema.prisma  ← Anime, Episode, AnimeFollow
apps/web/src/app/anime/
apps/web/src/app/calendar/
apps/web/src/components/anime/
apps/web/src/components/episode/
```

**Próximos passos para este domínio:**
1. `GET /anime/ranking` — top por nota da comunidade (já tem índice no banco: `ratingAverage, ratingCount`)
2. `GET /search?q=` — busca unificada anime + usuário
3. Página `/ranking` no frontend
4. Filtro por gênero no catálogo (UI)
5. Watchlist — nova tabela `user_watchlist` + endpoint + UI

---

### Domínio 3 — Comunidade (Comentários & Avaliações)

**O que é:** a alma social do produto — comentários em episódios e avaliações de anime.

**Estado atual:**
- ✅ Comentários com thread (replies), likes, spoiler, CRUD
- ✅ Pentagon Score (5 critérios) + cache agregado no anime
- ✅ Hot comments (mais engajados em 48h) para a home
- ✅ Review destaque na home
- ⬜ Seção de reviews dedicada na página do anime (paginação)
- ⬜ Moderação de comentários (modelos prontos no banco)
- ⬜ Denúncia de comentários (modelos prontos no banco)
- ⬜ Gráfico radar/pentágono comparando usuário vs comunidade
- ⬜ Reação em comentários (além de like — ex: "😂", "🔥", "😭")

**Arquivos relevantes:**
```
apps/api/src/modules/comments/
apps/api/src/modules/ratings/
apps/web/src/app/anime/[slug]/ep/[number]/
apps/web/src/components/comments/
apps/web/src/app/anime/[slug]/       ← ratings na página do anime
```

**Próximos passos para este domínio:**
1. Seção `/reviews` na página do anime com paginação (frontend + API já tem dados)
2. Denúncia de comentário — endpoint `POST /comments/:id/report` (banco tem `comment_reports`)
3. Painel de moderação em `/admin/moderation`
4. Gráfico radar SVG comparando nota do usuário vs média da comunidade

---

### Domínio 4 — Social (Feed & Notificações)

**O que é:** loop de retenção — o que sua rede está fazendo e alertas do que importa.

**Estado atual:**
- ✅ Feed de atividade de quem você segue (`/feed`)
- ✅ Atividade pública no perfil do usuário
- ✅ Notificações in-app (like, reply, novo seguidor, episódio novo)
- ✅ Sino no header com badge de não lidas
- ⬜ Paginação do feed (cursor pagination — hoje carrega tudo)
- ⬜ Toggle de notificação por anime na UI (campo `notifyOnEpisode` existe no banco)
- ⬜ Página de configurações de notificação
- ⬜ Push notifications web (quando episódio estreia)
- ⬜ E-mail de notificação

**Arquivos relevantes:**
```
apps/api/src/modules/feed/
apps/api/src/modules/notifications/
apps/api/src/modules/user-follow/
apps/web/src/app/feed/
apps/web/src/components/feed/
apps/web/src/components/layout/notifications-bell.tsx
apps/web/src/hooks/use-feed.ts
apps/web/src/hooks/use-notifications.ts
```

**Próximos passos para este domínio:**
1. Cursor pagination no `GET /feed/me?cursor=` — evitar carregar tudo
2. `PATCH /anime-follow/:animeId` — toggle `notifyOnEpisode` (campo já existe no banco)
3. Botão na UI do anime para desligar/ligar notificações de episódio
4. Push notifications — integrar Web Push API (service worker)

---

### Domínio 5 — Gamificação (Hype XP & Badges)

**O que é:** sistema de reputação e identidade do usuário na plataforma.

**Estado atual:**
- ✅ Hype XP: ganho por comentar, reply, like recebido, rating, seguir anime
- ✅ Níveis calculados pelo total de XP acumulado
- ✅ Exibido no perfil público
- ⬜ Ranking de usuários por Hype XP (`/ranking/usuarios`)
- ⬜ Badges — modelos prontos no banco, mas sem lógica de concessão
- ⬜ Conquistas automáticas (ex: "Primeiro comentário", "10 ratings", "100 XP")
- ⬜ Daily login bonus (enum `DAILY_LOGIN` já existe em `HypeTransactionReason`)
- ⬜ Exibir badge equipado no perfil e nos comentários

**Arquivos relevantes:**
```
apps/api/src/modules/hype/
apps/api/prisma/schema.prisma  ← HypeLevel, HypeTransaction, Badge, UserBadge
apps/web/src/app/u/[username]/  ← exibe Hype XP
```

**Próximos passos para este domínio:**
1. `GET /ranking/usuarios` — top por `user_profiles.hype_xp`
2. Sistema de badges: serviço que checa condições e concede badge ao usuário
3. Exibir badge no comentário e no perfil
4. Daily login bonus — detectar primeiro login do dia e creditar XP

---

### Domínio 6 — Infraestrutura & DevOps

**O que é:** tudo que faz o projeto rodar em produção de forma confiável.

**Estado atual:**
- ✅ `docker-compose.yml` para PostgreSQL local
- ✅ `.env.example` para API e web
- ✅ Turborepo configurado para builds e dev paralelo
- ⬜ Docker Compose completo (API + Web + Postgres em um comando)
- ⬜ CI/CD com GitHub Actions (lint, typecheck, build a cada PR)
- ⬜ Deploy em VPS (staging + produção)
- ⬜ Variáveis de ambiente no servidor
- ⬜ Redis para cache (sync pesado, sessions)
- ⬜ Monitoramento de erros (Sentry)
- ⬜ Health check e uptime monitoring

**Arquivos relevantes:**
```
docker-compose.yml
apps/api/.env.example
apps/web/.env.example
turbo.json
package.json   ← scripts de build/dev/lint
apps/api/src/modules/health/   ← endpoint GET /health já existe
```

**Próximos passos para este domínio:**
1. `Dockerfile` para a API (NestJS)
2. `Dockerfile` para o frontend (Next.js)
3. `docker-compose.prod.yml` — API + Web + Postgres + Nginx
4. GitHub Actions: `ci.yml` → `npm run type-check && npm run lint && npm run build`
5. Deploy inicial em VPS (Hetzner, Railway, Render, etc.)
6. Secrets no GitHub para variáveis de produção

---

## O que falta — priorizado por impacto

### Alta prioridade (próximas semanas)

| # | Feature | Domínio | Esforço |
|---|---|---|---|
| 1 | Editar perfil (bio, displayName, avatar) | Usuário | Médio |
| 2 | Upload de avatar (R2/S3) | Usuário | Médio |
| 3 | Página de ranking de animes `/ranking` | Anime | Pequeno |
| 4 | Ranking de usuários por Hype XP | Gamificação | Pequeno |
| 5 | Busca global anime + usuário `/search` | Anime | Médio |
| 6 | Docker Compose completo + deploy inicial | Infra | Grande |

### Média prioridade

| # | Feature | Domínio | Esforço |
|---|---|---|---|
| 7 | Seção de reviews na página do anime | Comunidade | Pequeno |
| 8 | Paginação do feed | Social | Médio |
| 9 | Toggle notificação por anime | Social | Pequeno |
| 10 | Mobile bottom navigation com badge | UI Global | Médio |
| 11 | Perfil — lista de animes seguidos completa | Anime | Pequeno |
| 12 | CI/CD GitHub Actions | Infra | Médio |
| 13 | Badges — concessão automática | Gamificação | Médio |

### Baixa prioridade / futuro

| # | Feature | Domínio | Esforço |
|---|---|---|---|
| 14 | Watchlist ("quero assistir") | Anime | Médio |
| 15 | Moderação de comentários | Comunidade | Grande |
| 16 | Denúncia de comentários | Comunidade | Pequeno |
| 17 | OAuth Google/Discord | Usuário | Grande |
| 18 | Daily login bonus | Gamificação | Pequeno |
| 19 | Push notifications web | Social | Grande |
| 20 | E-mail de notificação | Social | Grande |
| 21 | WebSockets (tempo real) | Social | Grande |
| 22 | PWA avançado | Infra | Médio |

---

## Divisão sugerida para 3 devs

A divisão abaixo evita conflitos porque cada dev mexe em arquivos diferentes. Os pontos de atenção são sinalizados.

---

### Dev 1 — Frontend & Produto

**Foco:** páginas, componentes, polish visual, UX

**O que pegar:**
- Página de edição de perfil (`/configuracoes` ou modal)
- Página de ranking `/ranking` (animes + usuários)
- Seção de reviews com paginação na página do anime
- Mobile bottom navigation com badge de notificações
- Toggle de notificação por anime (UI do botão — API precisa do Dev 2)
- Melhorias de polish: animações, skeleton, estados vazios

**Arquivos que são seus:**
```
apps/web/src/app/configuracoes/     ← criar
apps/web/src/app/ranking/           ← criar
apps/web/src/components/            ← componentes novos
apps/web/src/app/anime/[slug]/      ← seção reviews
apps/web/src/hooks/use-*.ts         ← hooks para novas pages
apps/web/src/types/api.ts           ← adicionar novos tipos
```

**Pontos de atenção:**
- `site-header.tsx` e `auth-provider.tsx` — combinar antes de mexer, são centrais
- `services/api.ts` — combinar com Dev 2 para não ter conflito de merge

---

### Dev 2 — Backend & Features

**Foco:** novos endpoints, lógica de negócio, banco de dados

**O que pegar:**
- `PATCH /users/me` — editar perfil + upload avatar (integrar R2/S3)
- `GET /anime/ranking` — top animes por `ratingAverage`
- `GET /users/ranking` — top usuários por `hypeXp`
- `GET /search?q=` — busca unificada anime + usuário
- Paginação cursor no `GET /feed/me`
- `PATCH /anime-follow/:id` — toggle `notifyOnEpisode`
- Sistema de badges — serviço de concessão automática

**Arquivos que são seus:**
```
apps/api/src/modules/users/         ← editar perfil
apps/api/src/modules/ratings/       ← ranking anime
apps/api/src/modules/hype/          ← ranking usuários
apps/api/src/modules/feed/          ← paginação
apps/api/src/modules/anime-follow/  ← toggle notify
apps/api/src/modules/hype/          ← badges
apps/api/prisma/schema.prisma       ← se precisar de migration
```

**Pontos de atenção:**
- Qualquer mudança no `schema.prisma` → avisa o time antes (migration pode quebrar banco dos outros)
- `app.module.ts` → avisa antes de adicionar módulo (conflito de merge fácil)
- Coordenar com Dev 1 os tipos novos em `apps/web/src/types/api.ts`

---

### Dev 3 — Infra & DevOps

**Foco:** fazer o projeto rodar de verdade em produção

**O que pegar:**
- `Dockerfile` para API e web
- `docker-compose.prod.yml` — stack completa
- GitHub Actions CI (lint + typecheck + build no PR)
- Configuração de VPS + deploy
- Nginx como reverse proxy
- Variáveis de ambiente em produção (secrets do GitHub)
- SSL / HTTPS
- Monitoramento básico (uptime, health check)

**Arquivos que são seus:**
```
Dockerfile.api              ← criar
Dockerfile.web              ← criar
docker-compose.prod.yml     ← criar
.github/workflows/ci.yml    ← criar
nginx.conf                  ← criar
.env.production.example     ← criar
```

**Pontos de atenção:**
- O `apps/api/src/modules/health/` já tem o endpoint `GET /health` — usar como base para health check do Docker
- Certificar que `CORS_ORIGIN` em produção aponta para o domínio correto
- `DATABASE_URL` em produção aponta para o PostgreSQL do servidor, não localhost

---

## Regras de colaboração (evitar dor de cabeça)

```
1. Um branch por feature: feature/nome-da-feature
2. Antes de mexer em schema.prisma → avisa no chat do time
3. Antes de mexer em app.module.ts → avisa no chat do time
4. Antes de abrir PR → npm run type-check deve passar
5. Não commitar arquivos .env (nunca, jamais)
6. Não hardcodar URLs ou segredos no código
```

---

## Como rodar o projeto localmente

### Pré-requisitos
- Node.js 18+
- npm 9+
- PostgreSQL local (ou usar `docker compose up -d postgres`)

### Setup completo
```powershell
# 1. Instalar dependências
npm install

# 2. Copiar e preencher variáveis de ambiente
copy apps\api\.env.example apps\api\.env
copy apps\web\.env.example apps\web\.env

# 3. Criar banco e rodar migrations
npm run db:setup

# 4. Subir projeto completo
npm run dev

# 5. Popular com animes (primeira vez)
npm run sync:season
```

### URLs locais
| URL | O que é |
|---|---|
| `http://localhost:3002` | Frontend |
| `http://localhost:3001/api/v1` | API |
| `http://localhost:3001/api/docs` | Swagger — toda a API documentada |

### Conta admin
```
Email:    anihype@gmail.com
Senha:    AniHype1$
```

---

## Referência rápida de padrões de código

### Backend — como criar uma feature nova

```
1. Criar pasta: apps/api/src/modules/nome-feature/
2. Criar: nome-feature.module.ts
           nome-feature.controller.ts
           nome-feature.service.ts
           (opcional) nome-feature.repository.ts
3. Registrar em: apps/api/src/app.module.ts
4. Testar em: localhost:3001/api/docs
```

Padrões obrigatórios:
- Rotas públicas → `@Public()` no controller
- Rotas admin → `@Roles('ADMIN')`
- Resposta no envelope: `{ data: ..., message?: ... }`
- Lógica de negócio no **service**, nunca no controller

### Frontend — como consumir um endpoint novo

```
1. Adicionar função em: apps/web/src/services/api.ts
2. Criar hook em:       apps/web/src/hooks/use-nome.ts
3. Adicionar tipos em:  apps/web/src/types/api.ts
4. Usar na página/componente via o hook criado
```

Padrões obrigatórios:
- Datas e horários sempre via `src/lib/date-brt.ts` (BRT)
- Componentes de página em `src/app/[rota]/_components/`
- Componentes reutilizáveis em `src/components/`
- Estado de auth via `src/stores/auth.store.ts` (Zustand)

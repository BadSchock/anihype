# AniHype — Estado completo do projeto (Maio 2026)

Resumo técnico de tudo que está implementado, correções de qualidade concluídas, e próximos passos.

**Última atualização:** 29/05/2026 14:27 (BRT) — loop social completo (seguir usuário, feed, notificações, review destaque) + guia de onboarding para devs.

**Fase atual:** MVP social funcional — identidade social, comunidade em alta, loop entre usuários e notificações in-app implementados. Próxima frente: **perfil editável, rankings, busca global e infra (Docker/CI/deploy)**.

**Documentos relacionados:**
- `LEIA-ME-DEVS.md` — guia completo para onboarding do time
- `BRIEFING-PARA-PROXIMA-IA.md` — contexto rápido para IA
- `anihype_social_identity_guide.md` — filosofia e identidade do produto

---

## 1. Visão geral

O AniHype é uma plataforma brasileira de acompanhamento de anime sazonal, com foco em comunidade e hype semanal.

| Camada | Tecnologia |
|---|---|
| Backend (API) | NestJS 10 + TypeScript |
| Banco de dados | PostgreSQL + Prisma ORM |
| Frontend | Next.js 15 (App Router) + TailwindCSS |
| Monorepo | Turborepo + npm workspaces |

**Portas locais:**
- Frontend: `http://localhost:3002`
- API: `http://localhost:3001/api/v1`
- Swagger: `http://localhost:3001/api/docs`

**Infra local:** `docker-compose.yml` disponível para PostgreSQL (+ pgAdmin opcional via profile `tools`).

---

## 2. O que está funcionando hoje

### Backend
| Módulo | Rotas | Status |
|---|---|---|
| Health | `GET /health` | ✅ |
| Auth | register, login, refresh, logout, me | ✅ |
| Users | `GET /users/:username` | ✅ |
| **User Follow** | seguir/deixar de seguir usuário + followers/following + contadores | ✅ |
| Anime | listar, filtrar, buscar, detalhe por slug/ID + **streamingLinks** | ✅ |
| Episodes | today, calendar, recent, **trending**, por anime, por número + **commentCount** | ✅ |
| Comments | CRUD + like + spoiler + replies + **hot** | ✅ |
| **Ratings** | Pentagon Score por anime (CRUD + agregado) + **review destaque** | ✅ |
| **Sync** | anilist, mal, search, season | ✅ |
| **Cron** | sync diário/semanal + trigger admin | ✅ |
| **Highlights** | `GET /highlights/hero` + CRUD admin | ✅ |
| **Top Anime** | Top 4 perfil + CRUD | ✅ |
| **Anime Follow** | seguir/deixar de seguir + listagem perfil | ✅ |
| **Hype XP** | XP por comentário, like, rating, follow + níveis | ✅ |
| **Feed** | `GET /feed/me` + `GET /users/:username/activity` | ✅ |
| **Notifications** | listar, unread count, marcar lida(s) | ✅ |
| **Admin Anime** | editar capa/banner/trailer/streaming/horários + `isLocked` | ✅ |

### Frontend
| Página | URL | Status |
|---|---|---|
| Home | `/` | ✅ Hero + hoje + **comunidade em alta** + **review destaque** + recent + trending |
| Detalhe do anime | `/anime/[slug]` | ✅ Episódios + ratings + **onde assistir** + trailer + seguir |
| Episódio + comentários | `/anime/[slug]/ep/[number]` | ✅ Hero social + discussão + onde assistir + nav |
| Lista de animes | `/anime` | ✅ Filtros + busca com debounce |
| Calendário | `/calendar` | ✅ Próximos 7 dias (grid) |
| **Feed** | `/feed` | ✅ Atividade de quem você segue (auth) |
| Login / Cadastro | `/login`, `/register` | ✅ returnUrl + validação |
| Perfil público | `/u/[username]` | ✅ Avatar + bio + Top 4 + Seguindo animes + Hype XP + **seguir usuário** + **atividade** |
| Admin | `/admin` | ✅ Sync + cron + destaque hero + **editor de anime** (layout com guard) |

### Auth & sessão (Sprint 1 — concluído)
- Refresh token no boot (`AuthProvider`) — sessão sobrevive ao F5
- Interceptor 401 com retry automático
- Logout com `refreshToken` no body
- JWT opcional em rotas `@Public()` (likes, `likedByMe`)
- Ratings API corrigidos (`@CurrentUser('id')` → `user.sub`)

### Social & UX (Sprints 2–4 — concluído)
- Respostas de comentários (expandir thread)
- Erro visível em forms (comentário, rating, login, register)
- `returnUrl` no login; like deslogado → redirect
- Navegação entre episódios via API (não depende de `episodeCount`)
- Mobile: safe area, menu Conta com logout, skeleton auth
- ErrorState em trending, episódios, ratings, comentários
- Busca `/anime` com debounce 400ms
- CSP dinâmico (`NEXT_PUBLIC_API_URL`)
- Assets: `icon.svg`, `og-default.svg`, manifest atualizado
- Header: `site-header.tsx` com nav, auth, tema e **sino de notificações**

### Home — seções
| Seção | Endpoint | Lógica |
|---|---|---|
| **Hero** | `GET /highlights/hero` | Destaque da temporada (admin) ou fallback estático |
| Lançamentos de Hoje | `GET /episodes/today` | Episódios agendados para hoje (BRT) |
| **Comunidade em alta** | `GET /episodes/trending` + `GET /comments/hot` | Episódios mais comentados + comentários em destaque |
| **Review destaque** | `GET /ratings/featured` | Review de qualidade para a home |
| Últimos adicionados | `GET /episodes/recent?days=7` | Só episódios que **já foram ao ar** (`airTimeUtc <= agora`) |
| Em Exibição | `GET /anime?status=AIRING` | Trending por popularidade |

### Notificações in-app (v1 — concluído)
| Evento | Trigger |
|---|---|
| Like no comentário | `CommentsService` |
| Reply no comentário | `CommentsService` |
| Novo seguidor | `UserFollowService` |
| Episódio novo (anime seguido) | `SyncService` (anti-spam: 48h, dedup, só transição AIRED) |

---

## 3. Coleta de dados — como funciona hoje

### Regra de ouro
> O frontend **nunca** chama AniList ou Jikan diretamente. Sempre: **API externa → SyncService → PostgreSQL → Frontend**.

### Cron automático
| Job | Horário (BRT) | Ação |
|---|---|---|
| Diário | 04:00 | Re-sync animes em exibição |
| Semanal | Dom 03:00 | Sync completo da temporada |

Triggers manuais: `POST /sync/cron/trigger/daily|weekly` (admin).

### Fontes
- **AniList** (principal): metadados, airingSchedule, temporada paginada
- **Jikan/MAL**: fallback por MAL ID

Detalhes em `ANILIST-INTEGRACAO.md`.

---

## 4. Sistema de notas AniHype (Pentagon Score)

- 5 critérios (1–10): animation, story, characters, sound, hype (peso duplo)
- Tabela `anime_ratings` + cache agregado no `Anime`
- Ranking público só com 10+ avaliações
- Endpoints: `GET/POST/DELETE /anime/:slug/ratings`
- UI: formulário + pentágono na página do anime; badge ⚡ nos cards

---

## 5. Pendências menores (não bloqueiam produto)

| Item | Prioridade |
|---|---|
| Push GitHub (SSH do dev) | Infra — configurar chave ou HTTPS |
| Admin: checar `res.ok` em todos os syncs | Baixa |
| Middleware server-side em `/admin` | Baixa (layout client-side já protege) |
| PNG 192/512 para PWA legado | Baixa (SVG funciona) |
| Remover `lib/api-client.ts` duplicado | Baixa |
| Toggle `notifyOnEpisode` na UI | Média |

---

## 6. Roadmap — concluído e próximos passos

### ✅ Identidade social + utilidade (concluído)

| # | Feature | Notas |
|---|---|---|
| 1 | Top 4 perfil | `user_top_anime` + UI no perfil |
| 2 | Spoiler UX premium | blur + click-to-reveal |
| 3 | Radar/pentágono SVG | `community-score.tsx` |
| 4 | Trailer embed | YouTube na página do anime |
| 5 | Seguir anime | botão na página + seção no perfil |
| 6 | Hype XP v1 | comentário, reply, like, rating, follow |
| 7 | Onde assistir | `streamingLinks` na API + UI anime/episódio |
| 8 | Admin editor de anime | capa, banner, trailer, streaming, horários |
| 9 | `isLocked` no sync | protege imagens, links e **horários de episódio** |
| 10 | Home viva | seção “Comunidade em alta” (trending + hot comments) |
| 11 | Upgrade página de episódio | hero cinematográfico + hub de discussão |

### ✅ Loop social (concluído — 29/05/2026)

| # | Feature | Notas |
|---|---|---|
| 12 | Seguir usuário | API + botão + contadores no perfil |
| 13 | Feed | `/feed/me` + página `/feed` |
| 14 | Notificações v1 | like, reply, novo seguidor, episódio novo; sino no header |
| 15 | Polimentos | review destaque, atividade no perfil, sitemap, admin layout |
| 16 | Guia de onboarding | `LEIA-ME-DEVS.md` para o time de 3 devs |

### 🔜 Próximos passos (prioridade sugerida)

| Prioridade | Feature | Descrição |
|---|---|---|
| Alta | Editar perfil | `PATCH /users/me` — bio, avatar, displayName |
| Alta | Upload de avatar | Storage externo (R2/S3) |
| Alta | Ranking de animes | Página `/ranking` por nota da comunidade |
| Alta | Ranking de usuários | Top por Hype XP |
| Alta | Busca global | `GET /search?q=` — anime + usuário |
| Média | Paginação do feed | Cursor pagination em `/feed` |
| Média | Reviews na página do anime | Seção dedicada com paginação |
| Média | Mobile nav melhorada | Bottom nav + badge de notificações |
| Infra | Docker Compose completo | API + Web + Postgres em um comando |
| Infra | CI/CD | GitHub Actions (lint, build, typecheck) |
| Infra | Deploy | Staging e produção |
| Futuro | Push notifications | Web push quando episódio estreia |
| Futuro | WebSockets | Comentários em tempo real |

---

## 7. Conta admin padrão

| Campo | Valor |
|---|---|
| Email | `anihype@gmail.com` |
| Username | `anihype` |
| Senha | `AniHype1$` |
| Roles | `USER` + `ADMIN` |

---

## 8. Como popular o banco do zero

```powershell
npm run dev
npm run sync:season
# ou http://localhost:3002/admin → Importar temporada
```

Com Docker (só Postgres):
```powershell
docker compose up -d postgres
npm run db:setup
npm run dev
```

---

## 9. Arquivos principais

| Arquivo/Pasta | O que é |
|---|---|
| `LEIA-ME-DEVS.md` | Guia completo para onboarding do time |
| `apps/api/src/modules/ratings/` | Pentagon Score + review destaque |
| `apps/api/src/modules/sync/cron.service.ts` | Crons diário/semanal |
| `apps/api/src/modules/sync/sync.service.ts` | Sync + notificação de episódio novo |
| `apps/api/src/modules/anime-admin/` | Editor admin (metadados + streaming + horários) |
| `apps/api/src/modules/anime-follow/` | Seguir anime |
| `apps/api/src/modules/user-follow/` | Seguir usuário |
| `apps/api/src/modules/feed/` | Feed de atividade |
| `apps/api/src/modules/notifications/` | Notificações in-app |
| `apps/api/src/modules/hype/` | Hype XP |
| `apps/api/src/modules/highlights/` | Destaque hero da home |
| `apps/api/src/modules/episodes/` | today, calendar, recent, **trending** |
| `apps/api/src/modules/comments/` | comentários + **hot** |
| `apps/web/src/app/admin/_components/anime-admin-editor.tsx` | UI editor de anime |
| `apps/web/src/app/_sections/community-section.tsx` | Home “Comunidade em alta” |
| `apps/web/src/app/_sections/featured-review-section.tsx` | Review destaque na home |
| `apps/web/src/app/feed/` | Página de feed |
| `apps/web/src/components/layout/notifications-bell.tsx` | Sino de notificações |
| `apps/web/src/components/anime/where-to-watch.tsx` | Onde assistir |
| `apps/web/src/app/anime/[slug]/ep/[number]/_components/episode-hero.tsx` | Hero da página de episódio |
| `apps/web/src/providers/auth-provider.tsx` | Bootstrap de sessão |
| `apps/web/src/lib/auth-url.ts` | returnUrl seguro |
| `apps/web/src/lib/date-brt.ts` | Datas/horários em BRT |
| `apps/web/src/app/_sections/` | Seções da home |
| `docker-compose.yml` | PostgreSQL local |
| `SETUP-BANCO.md` | PostgreSQL + migrations |
| `ANILIST-INTEGRACAO.md` | Sync AniList |

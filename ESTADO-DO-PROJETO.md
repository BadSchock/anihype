# AniHype — Estado completo do projeto (Maio 2026)

Resumo técnico de tudo que está implementado, como os dados chegam ao site, e o que ainda dá para fazer.

---

## 1. Visão geral

O AniHype é uma plataforma brasileira de acompanhamento de anime. A stack é:

| Camada | Tecnologia |
|---|---|
| Backend (API) | NestJS 10 + TypeScript |
| Banco de dados | PostgreSQL + Prisma ORM |
| Frontend | Next.js 15 (App Router) + TailwindCSS |
| Monorepo | Turborepo + npm workspaces |

**Portas locais:**
- Frontend: `http://localhost:3000`
- API: `http://localhost:3001/api/v1`
- Swagger: `http://localhost:3001/api/docs`

---

## 2. O que está funcionando hoje

### Backend
| Módulo | Rotas | Status |
|---|---|---|
| Health | `GET /health` | ✅ |
| Auth | register, login, refresh, logout, me | ✅ |
| Users | `GET /users/:username` | ✅ |
| Anime | listar, filtrar, buscar, detalhe por slug/ID | ✅ |
| Episodes | hoje, calendário, por anime, por número | ✅ |
| Comments | CRUD + like + spoiler + replies | ✅ |
| **Sync** | anilist, mal, search, **season** | ✅ |

### Frontend
| Página | URL | Status |
|---|---|---|
| Home | `/` | ✅ |
| Lista de animes | `/anime` | ✅ |
| Detalhe do anime | `/anime/[slug]` | ✅ |
| Episódio + comentários | `/anime/[slug]/ep/[number]` | ✅ |
| Login | `/login` | ✅ |
| Cadastro | `/register` | ✅ |
| Perfil público | `/u/[username]` | ✅ |
| Admin (sync manual) | `/admin` | ✅ |
| Calendário | `/calendar` | ⚠️ rota existe mas sem página dedicada |

### Banco de dados (modelos Prisma)
O schema já tem tudo estruturado para crescer:

**Core:** `Anime`, `Episode`, `Genre`, `Studio`, `AnimeExternalId`, `AnimeImage`, `StreamingPlatform`

**Usuários:** `User`, `UserRole`, `Role`, `UserProfile`, `UserFollow`, `AnimeFollow`, `UserActivity`

**Gamificação:** `HypeLevel`, `HypeTransaction`, `Badge`, `UserBadge`, `PremiumSubscription`

**Social:** `Comment`, `CommentLike`, `CommentReport`, `Report`, `SpoilerSetting`

**Admin/Moderação:** `AdminLog`, `ModerationLog`, `Notification`, `NotificationPreference`, `SeasonalHighlight`

---

## 3. Coleta de dados — como funciona hoje

### Regra de ouro
> O frontend **nunca** chama AniList ou Jikan diretamente. Sempre: **API externa → SyncService → PostgreSQL → Frontend**.

### Fluxo completo

```
AniList GraphQL ─┐
                 ├─▶ SyncService ─▶ PostgreSQL ─▶ API NestJS ─▶ Frontend Next.js
Jikan (MAL) REST ┘   (upsert)       (fonte única)
```

### Fonte 1 — AniList (principal)

**URL:** `https://graphql.anilist.co`  
**Autenticação:** nenhuma — API pública gratuita  
**Rate limit:** ~90 req/min (usamos delay de 800ms entre animes no import em massa)

**O que buscamos:**

| Dado | Query GraphQL |
|---|---|
| Metadados completos de 1 anime | `ANIME_QUERY` (por ID ou busca) |
| Episódios agendados (airingSchedule) | `EPISODES_QUERY` (por ID) |
| **Temporada inteira paginada** | `SEASON_BROWSE_QUERY` / `SEASON_BROWSE_AIRING_QUERY` |

**Dados que chegam do AniList por anime:**
- Títulos (romaji, inglês, nativo)
- Sinopse
- Capa (`extraLarge`) e banner
- Status (`RELEASING`, `FINISHED`, `NOT_YET_RELEASED`, etc.)
- Formato (TV, ONA, OVA, MOVIE, SPECIAL)
- Fonte (MANGA, ORIGINAL, LIGHT_NOVEL, etc.)
- Temporada + ano
- Quantidade de episódios e duração
- Score médio e popularidade
- Trailer (YouTube)
- Gêneros
- Estúdios (com flag isMain)
- Episódios agendados (número, data/hora de exibição)

**Otimização atual:**
O `SEASON_BROWSE_QUERY` já retorna todos os campos de metadados em uma única request por página (50 animes/página). Só faz uma request extra por anime se ele estiver `AIRING` ou `NOT_YET_AIRED` (para buscar o airingSchedule).

### Fonte 2 — Jikan / MyAnimeList

**URL:** `https://api.jikan.moe/v4`  
**Autenticação:** nenhuma — API pública  
**Rate limit:** ~3 req/s

**O que buscamos:**
- Anime completo por MAL ID (`/anime/:id/full`)
- Episódios por MAL ID (`/anime/:id/episodes`)

**Diferença em relação ao AniList:**
- Episódios do MAL têm título em japonês/inglês mas sem horário preciso
- Não tem banner
- Não tem airingSchedule com timestamps

**Quando usar Jikan:**
- Sync individual por MAL ID (campo no painel admin)
- Quando o anime não está no AniList mas está no MAL

### Normalização

Ambas as fontes passam pelo mesmo normalizador (`NormalizedAnime`, `NormalizedEpisode`) antes de serem salvas. O sync faz **upsert** por `externalId` — rodar duas vezes não duplica nada.

---

## 4. Endpoints de sync (todos protegidos — role ADMIN)

```
POST /api/v1/sync/anilist          { "anilistId": 154587 }
POST /api/v1/sync/mal              { "malId": 52991 }
POST /api/v1/sync/search           { "search": "Frieren" }
GET  /api/v1/sync/season/defaults  → retorna temporada atual
POST /api/v1/sync/season           { "season": "SPRING", "seasonYear": 2026, "airingOnly": false, "delayMs": 800 }
```

### Script CLI (sem precisar do servidor HTTP)

```powershell
npm run sync:season                                    # temporada atual automática
npm run sync:season -- --season SPRING --year 2026    # específico
npm run sync:season -- --airing-only                  # só em exibição
npm run sync:season -- --delay 1200                   # delay maior se tiver rate limit
```

---

## 5. O que dá para fazer a partir de agora

### Funcionalidades prontas no banco, sem código novo

| Feature | O que falta |
|---|---|
| Seguir anime | Modelo `AnimeFollow` já existe — falta endpoint + botão no frontend |
| Seguir usuário | Modelo `UserFollow` já existe — falta endpoint + botão no frontend |
| Histórico de atividade | Modelo `UserActivity` já existe — falta gravar e exibir no perfil |
| Notificações | Modelo `Notification` + `NotificationPreference` — falta implementar |
| Badges | Modelo `Badge` + `UserBadge` — falta endpoint de atribuição + exibição |
| Hype XP | Modelo `HypeTransaction` + `HypeLevel` — falta lógica de ganho de XP |
| Highlights da temporada | Modelo `SeasonalHighlight` — falta endpoint de admin + hero na home |
| Premium | Modelo `PremiumSubscription` — falta integração de pagamento |
| Plataformas de streaming | Modelo `StreamingPlatform` + `AnimeStreamingPlatform` — falta popular |

### Melhorias na coleta de dados

| Melhoria | Esforço | Descrição |
|---|---|---|
| **Sync agendado (cron)** | Médio | Re-sync diário da temporada atual — atualiza episódios, scores, status |
| **Imagens extras** | Baixo | Modelo `AnimeImage` existe — popular com mais artes do AniList |
| **Plataformas de streaming** | Baixo | AniList retorna `streamingEpisodes` com links (Crunchyroll, etc.) — já buscamos, falta salvar |
| **Sync de temporadas antigas** | Baixo | Mesmo script, passar `--season WINTER --year 2025` etc. |
| **Sync contínuo em background** | Alto | Bull/Redis para filas — processa animes em background sem timeout HTTP |
| **Webhook AniList** | Alto | AniList não tem webhook, mas dá para criar cron que detecta mudanças de status |

### Funcionalidades de produto

| Feature | Esforço | Descrição |
|---|---|---|
| Busca na home | Baixo | Campo de busca global com debounce |
| Filtros avançados em /anime | Baixo | Já tem query params no backend — falta UI de filtros |
| Página /calendar dedicada | Baixo | Componente de calendário já existe como seção — virar página própria |
| Rating de episódios | Médio | Usuário dar nota ao episódio — `scoreAverage` já existe no modelo |
| Lista pessoal (watching/completed) | Médio | Tipo do Anilist — modelo não tem ainda |
| Página de temporada | Médio | `/season/spring-2026` mostrando todos os animes da temporada |
| Feed de atividade | Médio | Timeline de quem você segue |
| Sistema de spoiler avançado | Baixo | Já tem `isSpoiler` nos comentários — falta UI de toggle |
| PWA / notificações push | Alto | `manifest.json` já existe — falta service worker |

---

## 6. Dados que chegam mas ainda não salvamos

O AniList retorna `streamingEpisodes` com links diretos para Crunchyroll, HIDIVE, etc. Já buscamos esses dados na query mas não salvamos no banco. Ficaria assim:

```
Anime X → streamingEpisodes → [{ site: "Crunchyroll", url: "...", title: "Ep 1", thumbnail: "..." }]
```

O modelo `AnimeStreamingPlatform` e `StreamingPlatform` já estão prontos no Prisma. Só precisaria mapear e salvar no `upsertAnimeWithEpisodes`.

---

## 7. Conta admin padrão

| Campo | Valor |
|---|---|
| Email | `anihype@gmail.com` |
| Username | `anihype` |
| Senha | `AniHype1$` |
| Roles | `USER` + `ADMIN` |

Criada automaticamente no seed (`npm run db:setup`). Se limpar o cache do browser, basta logar de novo — o banco não é afetado.

---

## 8. Como popular o banco do zero

```powershell
# 1. Subir tudo
npm run dev

# 2. Importar temporada atual (no terminal separado)
npm run sync:season

# 3. Ou pelo painel admin
# http://localhost:3000/admin → "Importar temporada" → SPRING 2026
```

O import leva 3–10 minutos para uma temporada completa (~50–70 animes). Após isso, home e `/anime` mostram conteúdo.

---

## 9. Arquivos principais do projeto

| Arquivo/Pasta | O que é |
|---|---|
| `apps/api/src/modules/providers/anilist/` | Integração com AniList GraphQL |
| `apps/api/src/modules/providers/jikan/` | Integração com Jikan/MAL REST |
| `apps/api/src/modules/sync/` | SyncService, controller e endpoints |
| `apps/api/scripts/sync-season.ts` | CLI para import em massa |
| `apps/api/prisma/schema.prisma` | Schema completo do banco |
| `apps/api/prisma/seed.ts` | Seed: roles, badges, hype levels, admin user |
| `apps/web/src/app/` | Páginas Next.js |
| `apps/web/src/services/api.ts` | Todas as chamadas HTTP ao backend |
| `apps/web/src/hooks/` | Hooks React Query |
| `apps/web/src/stores/auth.store.ts` | Estado de autenticação (Zustand) |
| `SETUP-BANCO.md` | Como configurar o PostgreSQL e rodar migrations |
| `ANILIST-INTEGRACAO.md` | Detalhes da integração AniList + sync |
| `SITUACAO-PROJETO.md` | Contexto inicial e decisões de arquitetura |

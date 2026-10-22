> **Documento antigo.** Parte do que está aqui já mudou. O estado real do projeto está em [ESTADO-ATUAL.md](./ESTADO-ATUAL.md).

# AniHype — Situação do projeto e integrações

Documento de referência para decidir os próximos passos (atualizado em maio/2026).  
Complementa: [README.md](./README.md), [ACOMPANHAMENTO.md](./ACOMPANHAMENTO.md), [SETUP-BANCO.md](./SETUP-BANCO.md).

---

## Resumo em 30 segundos

| O que temos | Situação |
|-------------|----------|
| **Código da V1 (guia, etapas 1–15)** | Implementado |
| **Backend + banco + auth + APIs de anime** | Funcionando |
| **Frontend (home, animes, episódio, login, admin)** | Funcionando |
| **Dados de anime no banco** | **Vazio** — por isso a home mostra “sem lançamentos” |
| **Importação em massa da temporada atual** | **Ainda não feita** — é o próximo passo lógico |

**Conclusão:** o produto está pronto para *receber* conteúdo. Falta *popular* o banco (idealmente todos os animes da temporada atual de 2026).

---

## O que é o AniHype

Plataforma brasileira para:

- Ver o que lança hoje e o calendário da semana  
- Abrir página de anime e de episódio  
- Comentar (com spoiler), curtir, ter perfil  
- Admin importar dados de APIs externas  

**Regra de ouro:** o frontend **nunca** chama AniList/MAL direto. Tudo passa pelo backend → PostgreSQL → frontend.

---

## Estrutura do repositório

```
AniHype/
├── apps/
│   ├── api/          # NestJS + Prisma (porta 3001)
│   └── web/          # Next.js 15 (porta 3000)
├── packages/         # tsconfig, eslint, types, ui, config
├── anihype_v1_cursor_implementation_guide.md   # Guia oficial
├── ACOMPANHAMENTO.md                           # Log técnico por etapa
├── SETUP-BANCO.md                              # Como rodar migrations/seed
└── README.md                                   # Como rodar o projeto
```

---

## Etapas do guia — status

| # | Etapa | Status |
|---|--------|--------|
| 1 | Setup monorepo | Concluída |
| 2 | Setup backend (Nest, Prisma, health, config) | Concluída |
| 3 | Schema Prisma + migrations + seed | Concluída |
| 4 | Auth (register, login, refresh, JWT, roles) | Concluída |
| 5 | Anime backend (listar, buscar, slug) | Concluída |
| 6 | Episodes backend (hoje, calendário, por anime) | Concluída |
| 7 | Comments backend (likes, spoiler, replies) | Concluída |
| 8 | **Providers + Sync** (AniList, Jikan/MAL) | Concluída |
| 9 | Frontend foundation (layout, tema, componentes) | Concluída |
| 10 | Homepage (hero, hoje, calendário, trending) | Concluída |
| 11 | Páginas de anime | Concluída |
| 12 | Página de episódio + comentários | Concluída |
| 13 | Perfil público `/u/[username]` | Concluída |
| 14 | Admin `/admin` (sync manual) | Concluída |
| 15 | SEO, polish, loading, tema claro/escuro | Concluída |

**Não está no guia V1 (mas você pediu):**

- Script para importar **toda a temporada atual** de uma vez  
- Sync automático agendado (cron)  
- Catálogo completo histórico (milhares de títulos)

---

## Como rodar hoje

```bash
# 1. Dependências (raiz)
npm install

# 2. Banco: criar DB "anihype" no Postgres + apps/api/.env

# 3. Tabelas + seed (roles, badges, etc.)
npm run db:setup

# 4. Subir tudo
npm run dev
```

| URL | Uso |
|-----|-----|
| http://localhost:3000 | Site |
| http://localhost:3001/api/v1/health | API saudável? |
| http://localhost:3001/api/docs | Swagger (testar endpoints) |
| http://localhost:3000/admin | Painel sync (precisa ADMIN) |

Se der erro de `.next` corrompido no web:

```powershell
Remove-Item -Recurse -Force apps\web\.next
npm run dev
```

---

## Integrações externas (Etapa 8)

### Arquitetura

```
┌─────────────┐     ┌─────────────┐
│  AniList    │     │ Jikan (MAL) │
│  GraphQL    │     │ REST v4     │
└──────┬──────┘     └──────┬──────┘
       │                   │
       └─────────┬─────────┘
                 ▼
        ┌────────────────┐
        │  SyncService   │  normaliza título, slug, gêneros,
        │  (apps/api)    │  estúdios, episódios → upsert no PG
        └────────┬───────┘
                 ▼
        ┌────────────────┐
        │  PostgreSQL    │  fonte única para o site
        └────────┬───────┘
                 ▼
        ┌────────────────┐
        │  Frontend      │  só lê /api/v1/anime, /episodes...
        └────────────────┘
```

### Fontes configuradas

| Fonte | Variável `.env` | O que traz |
|-------|------------------|------------|
| **AniList** | `ANILIST_API_URL` (default: graphql.anilist.co) | Metadados ricos, busca por nome, agenda de episódios |
| **Jikan** | `JIKAN_API_URL` (default: api.jikan.moe/v4) | Dados do **MyAnimeList** por ID MAL |

Arquivos principais:

- `apps/api/src/modules/providers/anilist/anilist.service.ts`
- `apps/api/src/modules/providers/jikan/jikan.service.ts`
- `apps/api/src/modules/sync/sync.service.ts`
- `apps/api/src/modules/sync/sync.controller.ts`

### Endpoints de sync (protegidos — role `ADMIN`)

Prefixo: `/api/v1/sync` (Bearer JWT obrigatório)

| Método | Body | Descrição |
|--------|------|-----------|
| `POST /sync/anilist` | `{ "anilistId": 12345 }` | Um anime pelo ID AniList |
| `POST /sync/mal` | `{ "malId": 16498 }` | Um anime pelo ID MyAnimeList (via Jikan) |
| `POST /sync/search` | `{ "search": "Frieren" }` | Busca no AniList e importa até **5** resultados |

O sync faz **upsert**: se o anime já existe (pelo `externalId`), atualiza; senão cria. Episódios são criados/atualizados por `(animeId + número)`.

### Painel admin no frontend

- Rota: `/admin`  
- Mesmas 3 ações (AniList ID, MAL ID, busca por título)  
- Só aparece link Admin na navbar se o usuário tiver role `ADMIN`

### Como virar ADMIN (seed não dá admin automático)

No pgAdmin, no banco `anihype`:

```sql
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'SEU_USERNAME' AND r.code = 'ADMIN'
ON CONFLICT DO NOTHING;
```

---

## Por que a home está vazia

As seções **Lançamentos de hoje** e **Calendário semanal** leem episódios com `airDate` no **nosso** banco.

- Banco após `db:setup` = roles, badges, hype levels — **sem animes**  
- Nenhum sync foi rodado ainda → listas vazias (comportamento esperado)  
- **Em exibição** na home também lista animes com `status: AIRING` — vazio pelo mesmo motivo  

Assim que importar animes da temporada, home e `/anime` passam a mostrar conteúdo.

---

## Objetivo que você mencionou: temporada atual inteira

**Ideal:** carregar todos os animes da temporada em exibição agora (ex.: Spring 2026 / Winter 2026, conforme calendário AniList).

### O que já existe

- Sync **um a um** ou **busca com limite 5**  
- Não há endpoint “importar temporada SPRING 2026” pronto  

### O que falta implementar (decisão de amanhã)

Opções possíveis, da mais simples à mais completa:

| Opção | Esforço | Descrição |
|-------|---------|-----------|
| **A** | Baixo | Script CLI ou endpoint `POST /sync/season` que consulta AniList: `season=SPRING`, `seasonYear=2026`, pagina todas as páginas e importa cada anime |
| **B** | Médio | Mesmo que A + filtro só `status=RELEASING` + delay entre requests (rate limit Jikan/AniList) |
| **C** | Médio | Lista curada (JSON com 30–50 IDs da temporada) + loop de sync — controle manual, menos risco de ban |
| **D** | Alto | Job agendado (cron) re-sync diário da temporada |

**Recomendação para amanhã:** começar com **opção A ou B** usando **só AniList** (já integrado, metadados + episódios agendados melhores para calendário).

### Referência AniList (temporada)

Query GraphQL típica (conceito):

- `season: SPRING` (ou WINTER, SUMMER, FALL)  
- `seasonYear: 2026`  
- `status: RELEASING` (em exibição)  
- Paginar `Page` até acabar  

Isso seria um novo método em `AniListService` + `SyncService.syncCurrentSeason()`.

### Rate limits (importante)

- **Jikan:** ~3 req/s — não disparar centenas de requests seguidas  
- **AniList:** mais tolerante, mas usar pausa entre animes (ex. 300–500 ms) em import em massa  

---

## Módulos da API (o que já responde)

| Módulo | Rotas principais | Público? |
|--------|-------------------|----------|
| Health | `GET /health` | Sim |
| Auth | register, login, refresh, logout, me | Misto |
| Users | `GET /users/:username` | Sim |
| Anime | `GET /anime`, `GET /anime/:idOrSlug` | Sim |
| Episodes | `GET /episodes/today`, `/calendar`, anime/episodes | Sim |
| Comments | CRUD + like | Auth para escrever |
| Sync | `/sync/*` | **ADMIN** |

---

## Frontend — páginas prontas

| Rota | Função |
|------|--------|
| `/` | Home: hero, lançamentos hoje, calendário, em exibição |
| `/anime` | Lista com busca e filtros |
| `/anime/[slug]` | Detalhe + episódios |
| `/anime/[slug]/ep/[number]` | Episódio + comentários |
| `/login`, `/register` | Auth |
| `/admin` | Sync manual |
| `/u/[username]` | Perfil |

Tema: segue sistema (claro/escuro) + botão ☀️/🌙 na navbar.

---

## Banco de dados

- PostgreSQL, nome sugerido: `anihype`  
- Prisma schema completo: users, anime, episodes, comments, genres, studios, external_ids, etc.  
- IDs inteiros, snake_case nas tabelas, soft delete onde faz sentido  

Comandos:

```bash
npm run db:setup    # migrate + seed
npm run db:migrate  # só migrations
npm run db:seed     # só seed
```

---

## Git / deploy

- Commits locais na branch `main` com etapas 1–15  
- Remote configurado (`origin` → GitHub)  
- Push pode precisar ser feito da sua máquina (SSH/credenciais)  

Deploy produção (guia Etapa 15): sitemap, robots, headers segurança — preparado no Next; falta hospedar API + web + Postgres.

---

## Checklist para amanhã

Use como pauta de decisão:

- [ ] Confirmar API + web + banco rodando (`npm run dev`, health ok)  
- [ ] Dar role ADMIN ao seu usuário (SQL acima)  
- [ ] Testar 1 sync manual: `/admin` → buscar `"Frieren"` ou MAL `52991`  
- [ ] Ver se home e `/anime` mostram dados  
- [ ] Decidir: implementar **import temporada completa** (qual opção A/B/C)  
- [ ] Definir temporada: `SPRING 2026` vs `WINTER 2026` (ver [AniList Season](https://anilist.co/search/anime?season=SPRING&year=2026))  
- [ ] (Opcional) Documentar lista de IDs prioritários se quiser controle fino  
- [ ] (Opcional) Push para GitHub / passar projeto para amigos (`README` + `SETUP-BANCO`)  

---

## Arquivos úteis

| Arquivo | Conteúdo |
|---------|----------|
| [README.md](./README.md) | Instalação rápida |
| [SETUP-BANCO.md](./SETUP-BANCO.md) | Postgres + Prisma sem SQL manual |
| [ACOMPANHAMENTO.md](./ACOMPANHAMENTO.md) | Histórico detalhado por etapa |
| [anihype_v1_cursor_implementation_guide.md](./anihype_v1_cursor_implementation_guide.md) | Especificação completa V1 |
| **Este arquivo** | Situação atual + integrações + próximo passo |

---

## Mensagem final

O AniHype **não está incompleto** — está **sem conteúdo importado**. A stack V1 do guia está montada. O passo que transforma o site de “casca bonita” em “plataforma com anime de verdade” é **popular o banco**, começando pela **temporada atual** via sync em massa (a implementar ou rodar manualmente em lote no admin).

Qualquer dúvida amanhã: abra este arquivo e escolha entre testar sync manual hoje ou pedir implementação do `sync/season`.

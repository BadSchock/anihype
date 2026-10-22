> **Documento antigo.** Parte do que está aqui já mudou. O estado real do projeto está em [ESTADO-ATUAL.md](./ESTADO-ATUAL.md).

# AniHype — Guia para Devs

> Leia este arquivo antes de escrever qualquer linha de código.  
> Ele explica o que é o projeto, o que já foi feito, como tudo funciona e o que ainda precisamos construir.

---

## O que é o AniHype

O **AniHype** é uma plataforma brasileira de acompanhamento de anime sazonal.

A ideia principal é:

> "O Letterboxd do anime brasileiro — uma rede social premium onde você acompanha lançamentos da semana, discute episódios e vive o hype da comunidade."

**Não é** um banco de dados como AniList/MAL.  
**É** uma plataforma de comunidade e descoberta, com identidade social própria.

A sensação que o produto deve transmitir é:
> *"Esse site está vivo."*

---

## Stack de tecnologia

| Camada | Tecnologia |
|---|---|
| Monorepo | Turborepo + npm workspaces |
| Backend (API) | NestJS 10 + TypeScript |
| Banco de dados | PostgreSQL + Prisma ORM |
| Frontend | Next.js 15 + App Router + TailwindCSS |
| Autenticação | JWT (15min) + Refresh Token (7 dias) |
| Dados externos | AniList (principal) + Jikan/MAL (fallback) |

### Estrutura de pastas

```
anihype/
├── apps/
│   ├── api/          → API NestJS
│   │   ├── prisma/   → Schema do banco + migrations
│   │   └── src/
│   │       ├── modules/   → Cada feature = um módulo
│   │       ├── common/    → Guards, decorators, filtros
│   │       └── config/    → Variáveis de ambiente
│   └── web/          → Frontend Next.js
│       └── src/
│           ├── app/        → Páginas (App Router)
│           ├── components/ → Componentes reutilizáveis
│           ├── hooks/      → React Query hooks
│           ├── services/   → Funções que chamam a API
│           ├── stores/     → Zustand (estado global)
│           └── types/      → Tipos TypeScript da API
└── packages/
    └── ui/           → Componentes base compartilhados (cn, Badge, etc.)
```

---

## Como rodar localmente

### Pré-requisitos

- Node.js 18+
- npm 9+
- PostgreSQL rodando localmente

### 1. Instalar dependências

```powershell
npm install
```

### 2. Configurar variáveis de ambiente

Copie os `.env.example` e preencha:

```powershell
# API
copy apps\api\.env.example apps\api\.env

# Web
copy apps\web\.env.example apps\web\.env
```

**API — valores obrigatórios:**
```env
DATABASE_URL=postgresql://postgres:SUA_SENHA@localhost:5432/anihype
JWT_SECRET=qualquer-string-longa-aleatoria
REFRESH_TOKEN_SECRET=outra-string-diferente
CORS_ORIGIN=http://localhost:3002
```

**Web — valores obrigatórios:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3002
```

### 3. Criar e migrar o banco

```powershell
npm run db:setup      # cria DB, roda migrations e seed de roles
```

### 4. Rodar em desenvolvimento

```powershell
# Ambos ao mesmo tempo (recomendado)
npm run dev

# Ou em terminais separados:
npm run dev:api   # API em localhost:3001
npm run dev:web   # Frontend em localhost:3002
```

### 5. Popular com animes (necessário na primeira vez)

Após os servidores subirem, acesse:
- `http://localhost:3002/admin`
- Login: `anihype@gmail.com` / `AniHype1$`
- Clique em **"Importar temporada"**

Ou via terminal:
```powershell
npm run sync:season
```

### URLs úteis

| URL | O que é |
|---|---|
| `http://localhost:3002` | Frontend |
| `http://localhost:3001/api/v1` | API |
| `http://localhost:3001/api/docs` | Swagger (documentação completa da API) |

---

## Regra de ouro da arquitetura

> **O frontend NUNCA chama AniList ou Jikan diretamente.**

O único caminho permitido é:

```
AniList/Jikan → SyncService (API) → PostgreSQL → Frontend
```

Toda chamada de dados de anime passa pelo nosso banco. Isso garante performance, controle e independência das APIs externas.

---

## Como os dados de anime chegam no banco

O `SyncService` é o coração do sistema. Ele:

1. Recebe um ID externo (AniList ou MAL)
2. Chama a API externa
3. Normaliza os dados (títulos, episódios, streaming, horários)
4. Faz `upsert` no PostgreSQL

**Cron automático:**

| Job | Horário (BRT) | O que faz |
|---|---|---|
| Diário | 04:00 | Re-sync de animes em exibição |
| Semanal | Dom 03:00 | Sync completo da temporada atual |

**Triggers manuais** (painel admin ou HTTP):
- `POST /api/v1/sync/anilist` — sync por AniList ID
- `POST /api/v1/sync/mal` — sync por MAL ID
- `POST /api/v1/sync/season` — importar temporada inteira
- `POST /api/v1/sync/cron/trigger/daily` — disparar cron manualmente

---

## O que já está implementado

### Backend (API)

| Módulo | O que faz |
|---|---|
| `auth` | Register, login, refresh token, logout, /me |
| `users` | Perfil público |
| `user-follow` | Seguir/deixar de seguir usuários |
| `anime` | Listar, filtrar, buscar, detalhe com streaming |
| `anime-follow` | Seguir animes |
| `anime-admin` | Editar capa, banner, trailer, links, horários + `isLocked` |
| `episodes` | Today, calendar, recent, trending, por anime |
| `comments` | CRUD + likes + spoiler + replies + hot |
| `ratings` | Pentagon Score — CRUD + agregado + review em destaque |
| `highlights` | Destaque hero da home |
| `top-anime` | Top 4 de cada perfil |
| `hype` | Sistema de XP por atividade |
| `feed` | Feed de atividade de quem você segue |
| `notifications` | Notificações in-app (like, reply, seguidor, episódio novo) |
| `sync` | Sync AniList/Jikan + cron |

### Frontend (Web)

| Página | URL | O que tem |
|---|---|---|
| Home | `/` | Hero, lançamentos de hoje, comunidade em alta, review destaque, trending |
| Lista de animes | `/anime` | Filtros, busca com debounce |
| Anime | `/anime/[slug]` | Banner, episódios, Pentagon Score, trailer, onde assistir, seguir |
| Episódio | `/anime/[slug]/ep/[number]` | Hero, comentários, navegação, onde assistir |
| Calendário | `/calendar` | Próximos 7 dias |
| Feed | `/feed` | Atividade de quem você segue |
| Perfil | `/u/[username]` | Avatar, bio, seguidores, Top 4, Hype XP, atividade |
| Login / Cadastro | `/login`, `/register` | Com `returnUrl` |
| Admin | `/admin` | Sync, cron, highlights, editor de anime |

---

## Sistema de Notas — Pentagon Score

O sistema de notas do AniHype é próprio. Não usa a nota do AniList como definitiva.

**5 critérios (escala 1–10):**

| Critério | Ícone | O que avalia |
|---|---|---|
| Animação | 🎨 | Visual e direção de arte |
| Roteiro | 📖 | História e ritmo |
| Personagens | 🎭 | Desenvolvimento e carisma |
| Som & Música | 🎵 | OST, vozes, ambientação |
| Hype | ⚡ | Emoção, impacto e diversão |

**Fórmula (hype tem peso duplo):**
```
nota_final = (animação + roteiro + personagens + som + hype × 2) / 6
```

**Badges:**

| Nota | Badge |
|---|---|
| 9.0+ | 👑 Obra-Prima |
| 8.0+ | 🔥 Excelente |
| 7.0+ | ⭐ Recomendado |
| 5.0+ | 👍 Ok |
| < 5.0 | 💤 Decepcionante |

---

## Sistema Hype XP

Cada usuário acumula XP pelas interações na plataforma. É o sistema de reputação do site.

| Ação | XP |
|---|---|
| Comentar em episódio | +5 |
| Fazer reply | +3 |
| Receber like no comentário | +2 |
| Postar avaliação (rating) | +10 |
| Seguir um anime | +5 |

Os níveis são calculados pelo total acumulado e aparecem no perfil do usuário.

---

## Notificações in-app

Disparadas automaticamente pelos serviços da API. O usuário vê no sino 🔔 no header.

| Evento | Quem recebe |
|---|---|
| Alguém curtiu seu comentário | Autor do comentário |
| Alguém respondeu seu comentário | Autor do comentário |
| Alguém começou a te seguir | Usuário seguido |
| Episódio novo do anime que você segue | Todos os seguidores do anime |

**Anti-spam no episódio novo:** só notifica se o episódio foi ao ar nas últimas 48h e na transição para `AIRED`. Nunca duplica.

---

## Convenções de código

### Backend

- Cada feature = um módulo em `apps/api/src/modules/`
- Padrão: `controller → service → repository (quando existe)`
- Respostas sempre no envelope: `{ data: ..., message?: ... }`
- Rotas públicas = `@Public()` decorator
- Rotas de admin = `@Roles('ADMIN')` decorator
- O `PrismaService` é injetado diretamente nos services
- `NotificationsService` e `HypeService` são globais (injetáveis em qualquer módulo)

### Frontend

- Cada chamada de API fica em `src/services/api.ts`
- Cada hook de React Query fica em `src/hooks/use-*.ts`
- Componentes de UI puro em `src/components/`
- Componentes específicos de página em `src/app/[rota]/_components/`
- Estado global (auth) via Zustand em `src/stores/auth.store.ts`
- Tipos TypeScript da API espelhados em `src/types/api.ts`
- Datas e horários em BRT sempre via `src/lib/date-brt.ts`

---

## O que NÃO fazer

- Não chame AniList ou Jikan diretamente no frontend
- Não mexe em `apps/api/prisma/schema.prisma` sem comunicar ao time (precisa criar migration)
- Não adicione módulo em `app.module.ts` sem coordenar (conflito de merge fácil)
- Não altere `site-header.tsx` sem combinar — é componente central
- Não crie lógica de negócio no controller — fica no service
- Não hardcode segredos ou URLs — use sempre variáveis de ambiente

---

## O que ainda precisa ser feito

Abaixo estão as features que ainda não foram implementadas, em ordem de prioridade.

### Alta prioridade

| Feature | Descrição |
|---|---|
| Editar perfil | `PATCH /users/me` — bio, avatar (upload para S3/R2), displayName |
| Upload de avatar | Integração com storage externo (Cloudflare R2 ou S3) |
| Ranking de animes | Página `/ranking` — top animes por nota da comunidade |
| Ranking de usuários | Top usuários por Hype XP |
| Busca global | `GET /search?q=` — busca anime + usuário em um endpoint |

### Média prioridade

| Feature | Descrição |
|---|---|
| Toggle notificações | Botão para desligar alertas de episódio por anime |
| Paginação do feed | Carregar mais itens no `/feed` (cursor pagination) |
| Página de anime — reviews | Seção dedicada com paginação de reviews |
| Perfil — animes assistidos | Lista completa do que o usuário seguiu/avaliou |
| Mobile nav melhorada | Bottom navigation com badge de notificações |

### Infraestrutura

| Feature | Descrição |
|---|---|
| Docker Compose | Subir API + Web + PostgreSQL com um único comando |
| CI/CD | GitHub Actions para lint, build e typecheck no PR |
| Deploy | Configurar para staging e produção |
| Redis (opcional) | Cache para consultas pesadas de sync |
| Push notifications (futuro) | Web push quando o episódio estreia |

### Baixa prioridade / futuro

| Feature | Descrição |
|---|---|
| Watchlist | "Quero assistir" separado de "seguindo" |
| WebSockets | Contagem de comentários em tempo real |
| PWA avançado | Install prompt, ícones 512px |
| App mobile | React Native ou PWA nativo |

---

## Conta admin para testes

```
Email:    anihype@gmail.com
Senha:    AniHype1$
Username: anihype
```

---

## Fluxo de trabalho sugerido entre os devs

### Regras para evitar conflito

1. **Antes de criar migration** → avisa no chat do time, todos puxam `git pull` antes
2. **Antes de editar `app.module.ts`** → coordena com quem mais está mexendo no backend
3. **Um branch por feature** → `feature/nome-da-feature`
4. **PR com typecheck passando** → `npm run type-check` antes de abrir PR

### Divisão sugerida de frentes

**Dev 1 — Frontend & Produto**
- Editar perfil (UI)
- Ranking de animes e usuários (página + componentes)
- Melhorias de mobile nav
- Ajustes visuais e polish

**Dev 2 — Backend & Features**
- Endpoint de edição de perfil + upload de avatar
- Endpoint de ranking
- Busca global
- Testes unitários (Jest) nos services críticos

**Dev 3 — Infra & DevOps**
- Docker Compose
- GitHub Actions CI
- Configuração de staging/produção
- Variáveis de ambiente e secrets

---

## Filosofia do produto (ler uma vez, guardar para sempre)

O AniHype não compete com AniList ou MAL em quantidade de dados.

**Competimos em:**
- Comunidade e identidade social
- Hype e emoção semanal
- Experiência visual premium
- Retenção e engajamento

**Referência principal:** Letterboxd
**Inspirações visuais:** Netflix, apps premium modernos

**Pilares de UX:**
- Posters grandes, banners cinematográficos
- Hover elegante, glow discreto, blur suave
- Mobile-first sempre
- Zero poluição visual — menos é mais
- A sensação deve ser: *"esse site está vivo"*

---

## Dúvidas rápidas

**Como adicionar um novo endpoint?**
1. Cria o módulo em `apps/api/src/modules/nome/`
2. Adiciona o módulo em `app.module.ts`
3. Testa no Swagger em `localhost:3001/api/docs`
4. Adiciona a função em `apps/web/src/services/api.ts`
5. Cria o hook em `apps/web/src/hooks/use-nome.ts`

**Como mexer no banco?**
1. Edita `apps/api/prisma/schema.prisma`
2. Roda `npx prisma migrate dev --name descricao` dentro de `apps/api/`
3. Avisa o time para puxar e rodar a migration

**Como ver os logs do sync?**
A API loga cada anime sincronizado. Olha o terminal do `npm run dev:api`.

**Onde fica o Swagger?**
`http://localhost:3001/api/docs` — documenta todos os endpoints com request/response.

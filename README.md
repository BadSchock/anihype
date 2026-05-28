# AniHype

Plataforma para acompanhar lançamentos de anime, calendário semanal, páginas de anime/episódio e discussões com proteção contra spoilers. Projeto em monorepo (Turborepo), em desenvolvimento por etapas.

---

## Começar rápido

### O que você precisa

- **Node.js** 18 ou superior  
- **PostgreSQL** (pgAdmin ou outro cliente — **não** é obrigatório Docker)  
- **npm** 9+

### Passo a passo

**1. Instalar dependências** (na pasta raiz do repositório):

```bash
npm install
```

**2. Criar o banco no Postgres**

- Crie um banco **vazio** chamado `anihype` (sem tabelas).
- No pgAdmin: *Databases* → *Create* → *Database* → nome `anihype`.

**3. Configurar variáveis da API**

```bash
cd apps/api
copy .env.example .env
```

Edite `apps/api/.env`. O essencial:

```env
DATABASE_URL=postgresql://USUARIO:SENHA@localhost:5432/anihype
JWT_SECRET=uma-chave-secreta-com-pelo-menos-16-caracteres
REFRESH_TOKEN_SECRET=outra-chave-secreta-com-pelo-menos-16-caracteres
```

Se a senha tiver `$`, `@` ou `#`, use encoding na URL (ex.: `$` → `%24`). Detalhes em [SETUP-BANCO.md](./SETUP-BANCO.md).

**4. Criar tabelas e dados iniciais** (Prisma — um comando só):

```bash
cd ../..
npm run db:setup
```

Isso gera o client, aplica as migrations e roda o seed (roles, badges, etc.).

**5. Subir os apps**

Na raiz (web + api juntos):

```bash
npm run dev
```

Ou separado:

```bash
# Backend — http://localhost:3001
cd apps/api
npm run dev

# Frontend — http://localhost:3000
cd apps/web
npm run dev
```

**6. Conferir se está ok**

- API: [http://localhost:3001/api/v1/health](http://localhost:3001/api/v1/health) (`checks.database` deve ser `ok`)  
- Docs Swagger: [http://localhost:3001/api/docs](http://localhost:3001/api/docs)  
- Web: [http://localhost:3000](http://localhost:3000)

### Comandos úteis (raiz)

| Comando | O que faz |
|---------|-----------|
| `npm run dev` | Sobe frontend e backend em modo desenvolvimento |
| `npm run build` | Build de todos os pacotes |
| `npm run db:setup` | Banco: migrations + seed (primeira vez ou clone novo) |
| `npm run db:migrate` | Só aplica migrations pendentes |
| `npm run db:seed` | Só roda o seed de novo |

Quem clona o repo: `npm install` → criar banco `anihype` → configurar `apps/api/.env` → `npm run db:setup` → `npm run dev`.

Mais detalhes do banco: **[SETUP-BANCO.md](./SETUP-BANCO.md)**  
Progresso das etapas do guia: **[ACOMPANHAMENTO.md](./ACOMPANHAMENTO.md)**

---

## Sobre o projeto

O **AniHype** é a primeira versão pública de uma base pensada para escalar: backend preparado com schema completo, frontend enxuto que vai ganhando telas aos poucos.

**Ideia central:** “O que lançou hoje, quando sai o próximo episódio e onde o pessoal está comentando?”

**Stack principal**

| Camada | Tecnologias |
|--------|-------------|
| Frontend | Next.js (App Router), TypeScript, Tailwind, TanStack Query |
| Backend | NestJS, Prisma, PostgreSQL, JWT + refresh tokens |
| Monorepo | Turborepo, pacotes compartilhados em `packages/` |

**Já implementado (resumo)**

- Monorepo e configs compartilhadas  
- API com health check, validação de env, auth (register, login, logout, refresh, `/me`)  
- Schema Prisma completo + migrations versionadas no Git  

**Em construção (próximas etapas)**

- Módulos de anime, episódios, comentários, homepage, sync com AniList/Jikan, telas no frontend  

Regra importante: o **frontend nunca** chama AniList/Jikan direto — tudo passa pela API.

---

## Estrutura de pastas

```
AniHype/
├── apps/
│   ├── web/          ← Frontend (Next.js) — interface do usuário
│   └── api/          ← Backend (NestJS) — REST API, Prisma, auth
├── packages/
│   ├── types/        ← Tipos TypeScript compartilhados
│   ├── config/       ← Constantes (rotas API, roles, etc.)
│   ├── ui/           ← Utilitários de UI compartilhados
│   ├── tsconfig/     ← Configs TypeScript do monorepo
│   └── eslint-config/
├── package.json      ← Scripts da raiz (dev, build, db:setup)
├── turbo.json
├── SETUP-BANCO.md    ← Guia detalhado do Postgres + Prisma
└── ACOMPANHAMENTO.md ← O que já foi feito e o que vem depois
```

### Frontend — `apps/web`

- **Next.js 15** com App Router  
- Código em `apps/web/src/` (`app/`, `features/`, `components/`, etc.)  
- Roda na porta **3000**  
- Variáveis: copie `apps/web/.env.example` → `.env.local` (ex.: `NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1`)

### Backend — `apps/api`

- **NestJS** + **Prisma**  
- Código em `apps/api/src/` (`modules/`, `common/`, `prisma/`)  
- Roda na porta **3001**, prefixo **`/api/v1`**  
- Variáveis: `apps/api/.env` (obrigatório para rodar)  
- Banco: `apps/api/prisma/schema.prisma` e migrations em `apps/api/prisma/migrations/`

### Pacotes compartilhados — `packages/`

Código reutilizado entre web e api (tipos, configs, ESLint/TS). Não são apps — não rodam sozinhos.

---

## Documentação interna

- [anihype_v1_cursor_implementation_guide.md](./anihype_v1_cursor_implementation_guide.md) — guia completo de implementação V1  
- [SETUP-BANCO.md](./SETUP-BANCO.md) — banco com Prisma (sem colar SQL no pgAdmin)  
- [ACOMPANHAMENTO.md](./ACOMPANHAMENTO.md) — status das etapas  

---

## Licença

Projeto privado — uso conforme definido pelos mantenedores do repositório.

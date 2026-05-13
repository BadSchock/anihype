# AniHype — V1 Implementation Guide for Cursor

## IMPORTANTÍSSIMO

Este documento deve guiar o Cursor/Claude na implementação da **V1 do AniHype**.

Ele foi criado com base nos três documentos principais do projeto:

- `anihype_master_project_documentation.md`
- `anihype_cursor_engineering_blueprint.md`
- `anihype_implementation_roadmap.md`

A V1 deve respeitar a visão completa do AniHype, sem abandonar a arquitetura planejada para o futuro.

O objetivo NÃO é criar um protótipo rápido.

O objetivo é criar uma **base real, escalável, organizada e pronta para evoluir**, ativando no frontend apenas o que for necessário para a primeira versão pública.

---

# 1. Visão da V1

A V1 do AniHype deve ser uma primeira versão funcional da plataforma, focada em:

- acompanhar lançamentos sazonais;
- mostrar o que lança hoje;
- organizar calendário semanal;
- exibir páginas de anime;
- exibir páginas de episódios;
- permitir discussões por episódio;
- proteger usuários contra spoilers;
- criar base de usuários;
- preparar a comunidade para crescimento.

A V1 deve entregar o coração do produto:

> “O que lançou hoje, quando sai o próximo episódio e onde o pessoal está comentando?”

Mesmo que algumas funcionalidades ainda não estejam visíveis no frontend, o backend e o banco devem nascer preparados para a evolução completa do projeto.

---

# 2. Filosofia da Implementação

Cursor/Claude deve seguir estas regras durante TODA a implementação:

- Fazer tudo por etapas.
- Não tentar implementar a plataforma inteira de uma vez.
- Não criar arquivos gigantes.
- Não misturar regra de negócio com controller.
- Não colocar regra de negócio pesada no frontend.
- Não usar `any`, exceto quando absolutamente inevitável.
- Manter TypeScript estrito.
- Manter arquitetura modular.
- Criar componentes pequenos e reutilizáveis.
- Usar mobile-first desde o primeiro componente.
- Criar backend preparado para escalar.
- Criar banco de dados completo para a visão futura.
- Ativar no frontend apenas o necessário para a V1.
- Nunca depender diretamente de APIs externas no frontend.
- Toda integração externa deve passar pelo backend.
- Priorizar código limpo, organizado e fácil de manter.
- Fazer commits/entregas lógicas por fase, sempre com o projeto compilando.

---

# 3. Stack Obrigatória

## Frontend

Usar obrigatoriamente:

- Next.js com App Router
- TypeScript
- TailwindCSS
- shadcn/ui
- Framer Motion
- TanStack Query / React Query
- Zod

Princípios obrigatórios:

- mobile-first;
- SSR onde fizer sentido;
- SEO desde o começo;
- layout moderno, premium e limpo;
- componentes reutilizáveis;
- animações suaves e discretas;
- evitar visual poluído.

---

## Backend

Usar obrigatoriamente:

- NestJS
- TypeScript
- Prisma
- PostgreSQL
- JWT Auth
- Refresh Tokens
- validação com Zod ou class-validator
- arquitetura modular
- service layer
- repository abstraction quando fizer sentido
- DTOs validados
- guards para autenticação e roles

Princípios obrigatórios:

- controllers finos;
- regras de negócio em services;
- acesso ao banco centralizado;
- módulos independentes;
- validações explícitas;
- erros bem tratados;
- código preparado para crescer.

---

## Monorepo

Usar Turborepo.

Estrutura obrigatória:

```txt
apps/
 ├── web
 └── api

packages/
 ├── ui
 ├── types
 ├── config
 ├── eslint-config
 └── tsconfig
```

---

# 4. Estratégia da V1

A V1 deve ser implementada com uma estratégia dupla:

## 4.1 Backend preparado completo

O backend deve nascer com:

- schema Prisma completo das entidades principais;
- migrations organizadas;
- seeds iniciais;
- módulos principais criados;
- estrutura pronta para features futuras;
- guards e roles já pensados;
- tabelas futuras já existentes quando fizer sentido.

Isso permite que o AniHype cresça sem precisar refazer a fundação depois.

---

## 4.2 Frontend enxuto e ativado por fases

O frontend da V1 NÃO precisa mostrar tudo.

Na V1, o frontend deve ativar apenas:

- homepage;
- lançamentos de hoje;
- calendário semanal;
- página de anime;
- página de episódio;
- comentários;
- login/cadastro;
- perfil básico;
- spoiler básico;
- admin mínimo.

Funcionalidades como premium, badges avançados, notificações completas, gamificação avançada e follows podem existir no banco/backend, mas não precisam estar totalmente expostas na interface da V1.

---

# 5. Escopo Real da V1

## Deve estar ativo na V1

A V1 deve ter:

- autenticação básica;
- cadastro;
- login;
- logout;
- refresh token;
- homepage funcional;
- hero carousel simples;
- seção “lançamentos de hoje”;
- calendário semanal;
- página de anime;
- página de episódio;
- comentários por episódio;
- replies simples ou estrutura preparada;
- likes em comentários;
- spoiler tag básica;
- proteção visual de spoiler;
- perfil básico de usuário;
- admin básico;
- sync inicial com providers;
- banco local com dados normalizados;
- SEO básico;
- sitemap inicial;
- OpenGraph básico;
- layout mobile-first.

---

## Pode existir no backend/banco, mas não precisa estar ativo no frontend V1

Criar estrutura para:

- badges;
- user badges;
- hype XP;
- hype levels;
- hype transactions;
- follows de usuários;
- follows de anime;
- notificações;
- premium subscriptions;
- reports;
- moderação avançada;
- seasonal events;
- awards;
- logs administrativos;
- provider sync avançado;
- filas;
- cache;
- recomendações futuras.

Essas estruturas devem ser criadas com cuidado para não travar a evolução futura.

---

## Não implementar agora na V1

Não implementar ainda:

- aplicativo mobile;
- chat em tempo real;
- watch parties;
- livestream;
- sistema avançado de recomendação;
- IA de recomendações;
- ranking complexo;
- editorial/news completo;
- premium totalmente funcional;
- pagamento real;
- WebSocket complexo;
- notificações push;
- app internacional multilíngue completo.

A arquitetura deve permitir isso no futuro, mas a V1 não deve tentar entregar tudo.

---

# 6. Estrutura de Pastas

## apps/web

Estrutura recomendada:

```txt
src/
 ├── app/
 ├── components/
 ├── features/
 ├── hooks/
 ├── services/
 ├── stores/
 ├── lib/
 ├── types/
 ├── utils/
 ├── styles/
 └── providers/
```

Usar arquitetura feature-first.

Exemplo:

```txt
features/
 ├── auth/
 ├── anime/
 ├── episodes/
 ├── comments/
 ├── home/
 ├── profile/
 └── admin/
```

---

## apps/api

Estrutura recomendada:

```txt
src/
 ├── modules/
 ├── common/
 ├── prisma/
 ├── config/
 ├── jobs/
 ├── queues/
 ├── guards/
 ├── interceptors/
 ├── decorators/
 ├── pipes/
 ├── filters/
 └── main.ts
```

Cada módulo deve seguir padrão parecido com:

```txt
anime/
 ├── anime.controller.ts
 ├── anime.service.ts
 ├── anime.repository.ts
 ├── anime.module.ts
 ├── dto/
 ├── entities/
 └── types/
```

---

# 7. Banco de Dados da V1

O banco deve ser criado com visão completa.

## Regras obrigatórias

- Usar PostgreSQL.
- Usar Prisma.
- Usar snake_case nas tabelas e colunas.
- Usar nomes singulares nos models Prisma quando fizer sentido.
- Todas as tabelas principais devem ter integer ID.
- Não usar UUID como primary key principal.
- Usar timestamps em todas as entidades principais.
- Usar soft delete onde fizer sentido.
- Criar índices importantes desde o início.
- Criar foreign keys corretamente.
- Criar unique constraints quando necessário.

Exemplo de ID:

```sql
id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY
```

Campos obrigatórios padrão:

```txt
created_at
updated_at
```

Campo opcional:

```txt
deleted_at
```

---

# 8. Tabelas Principais

Criar no Prisma as entidades principais abaixo.

## Usuários e Permissões

- users
- roles
- user_roles
- refresh_tokens
- password_reset_tokens
- email_verification_tokens

Roles iniciais:

```txt
USER
PREMIUM
MODERATOR
ADMIN
SUPER_ADMIN
```

---

## Anime e Conteúdo

- anime
- episodes
- genres
- anime_genres
- studios
- anime_studios
- seasonal_highlights
- anime_external_ids
- anime_images
- streaming_platforms
- anime_streaming_platforms

---

## Discussões e Comunidade

- comments
- comment_likes
- comment_reports
- reports
- spoiler_settings

---

## Social

- user_follows
- anime_follows
- user_profiles
- user_activity

---

## Gamificação

- badges
- user_badges
- hype_levels
- hype_transactions

---

## Premium e Ads

- premium_subscriptions
- ad_slots

---

## Notificações

- notifications
- notification_preferences

---

## Administração e Auditoria

- admin_logs
- moderation_logs

---

# 9. Módulos Backend da V1

Mesmo que nem todos estejam completos, criar a estrutura modular correta.

## Módulos obrigatórios para funcionamento V1

Implementar funcionalmente:

- AuthModule
- UsersModule
- AnimeModule
- EpisodesModule
- CommentsModule
- HomeModule
- AdminModule básico
- ProvidersModule básico
- SyncModule básico

---

## Módulos que podem nascer estruturados, mas parcialmente implementados

Criar estrutura para:

- BadgesModule
- HypeModule
- NotificationsModule
- PremiumModule
- FollowsModule
- ReportsModule
- ModerationModule

Esses módulos podem ter schema, DTO inicial, module/service/controller básico e endpoints internos mínimos, mas não precisam estar completos no frontend.

---

# 10. Autenticação V1

Implementar:

- cadastro;
- login;
- logout;
- refresh token;
- hash de senha;
- JWT access token;
- refresh token seguro;
- AuthGuard;
- RolesGuard;
- decorator de usuário autenticado;
- validação de DTOs;
- proteção de rotas privadas.

Preparar arquitetura futura para:

- Google OAuth;
- Discord OAuth;
- verificação de email;
- recuperação de senha.

Na V1, Google OAuth pode ficar preparado, mas não precisa ser obrigatório se atrasar o lançamento.

---

# 11. Anime Data Strategy

Regra obrigatória:

> O frontend nunca deve consumir AniList, Jikan ou qualquer provider externo diretamente.

O backend deve ser responsável por:

- buscar dados externos;
- normalizar dados;
- salvar no PostgreSQL;
- criar/atualizar animes;
- criar/atualizar episódios;
- criar páginas/discussões de episódios;
- permitir override manual via admin.

Providers iniciais:

- AniList;
- Jikan.

Na V1, implementar sync básico:

- buscar anime;
- salvar anime;
- salvar gêneros;
- salvar estúdios;
- salvar episódios quando disponível;
- salvar airing schedule;
- criar slug;
- criar registros locais.

---

# 12. Homepage V1

A homepage deve ter visual premium, moderno e mobile-first.

## Seções obrigatórias

### 1. Hero Carousel

Na V1 pode ser simples, mas deve estar preparado para admin.

Deve ter:

- banners;
- título;
- subtítulo curto;
- imagem spoiler-safe;
- link para anime;
- botão/CTA;
- responsivo;
- animação discreta.

---

### 2. Lançamentos de Hoje

Core da V1.

Mostrar:

- anime;
- episódio;
- horário de lançamento;
- countdown ou status;
- imagem;
- link para episódio/anime.

---

### 3. Calendário Semanal

Mostrar dias da semana:

- segunda;
- terça;
- quarta;
- quinta;
- sexta;
- sábado;
- domingo.

Mobile:

- pode usar scroll horizontal;
- cards compactos;
- touch-friendly.

---

### 4. Trending Básico

Na V1 pode ser simples.

Exemplos:

- animes mais comentados;
- episódios mais comentados;
- discussões recentes.

---

# 13. Página de Anime V1

Rota:

```txt
/anime/[id]/[slug]
```

Deve mostrar:

- título;
- título japonês quando existir;
- capa;
- banner;
- sinopse;
- gêneros;
- estúdios;
- temporada;
- status;
- score externo/local quando existir;
- trailer quando existir;
- lista de episódios;
- informações de exibição;
- link para discussões de episódios.

A página deve ser SEO-ready:

- metadata;
- title;
- description;
- OpenGraph;
- canonical;
- structured data quando possível.

---

# 14. Página de Episódio V1

Rota:

```txt
/episode/[id]/[slug]
```

Deve mostrar:

- anime;
- número do episódio;
- título do episódio quando existir;
- data/hora de lançamento;
- status;
- score simples ou preparado;
- área de comentários;
- proteção contra spoiler;
- link de volta para anime.

O episódio deve ter uma discussão oficial.

Mesmo que o sistema de thread seja simples na V1, a modelagem deve permitir evolução.

---

# 15. Comentários V1

Implementar:

- criar comentário;
- listar comentários;
- comentar em episódio;
- replies básicos ou parent_id preparado;
- likes;
- spoiler flag;
- paginação;
- cooldown anti-spam simples;
- exclusão lógica;
- reports preparados.

Tabela comments deve permitir:

- comentário raiz;
- reply;
- vínculo com episódio;
- vínculo com usuário;
- spoiler;
- status de moderação;
- timestamps.

UX:

- mobile-first;
- fácil comentar;
- botão de spoiler;
- blur/click-to-reveal para spoiler;
- carregamento paginado.

---

# 16. Spoiler System V1

Implementar sistema simples, mas forte o suficiente para o começo.

Deve ter:

- tag de spoiler em comentários;
- blur visual;
- click-to-reveal;
- flag de spoiler no banco;
- proteção automática preparada por episódio recém-lançado.

Na V1, a proteção automática pode ser simples:

- episódios recentes podem mostrar aviso;
- comentários marcados como spoiler ficam ocultos até o usuário clicar.

Futuro:

- cooldown de spoiler por dias;
- moderação de spoilers;
- preferências por usuário.

---

# 17. Perfil de Usuário V1

Rota sugerida:

```txt
/u/[username]
```

Na V1 mostrar:

- nome;
- username;
- avatar;
- bio curta;
- data de entrada;
- badge principal se existir;
- Hype Level se já estiver disponível;
- comentários recentes básicos.

Mesmo que badges/hype não estejam 100% ativos, deixar a estrutura visual preparada.

---

# 18. Hype System V1

Criar tabelas e estrutura backend.

Na V1, pode implementar uma versão simples:

- usuário ganha XP ao comentar;
- usuário ganha XP ao receber like;
- registrar transações em hype_transactions;
- calcular level básico.

Não precisa expor painel avançado no frontend ainda.

Deixar pronto para evoluir com:

- eventos sazonais;
- conquistas;
- rankings;
- badges automáticas;
- recompensas cosméticas.

---

# 19. Badge System V1

Criar banco e estrutura.

Na V1, pode ter:

- badge Beta User;
- badge Founder;
- badge Admin/Moderator se necessário;
- usuário pode ter badges;
- usuário pode equipar uma badge principal.

No frontend, exibir apenas se já existir no perfil/comentários.

Não implementar sistema avançado de conquistas agora.

---

# 20. Admin Panel V1

Criar admin mínimo, mas com arquitetura correta.

## Funcionalidades V1

- login protegido por role;
- listar animes;
- editar dados básicos de anime;
- editar banner/capa se necessário;
- listar episódios;
- editar dados básicos de episódio;
- gerenciar hero carousel;
- remover comentário;
- visualizar reports básicos se já existirem.

## Preparar para futuro

- gestão de badges;
- gestão de premium;
- gestão de usuários;
- moderação completa;
- logs;
- eventos sazonais;
- anime awards.

---

# 21. SEO V1

Implementar desde o começo:

- SSR nas páginas públicas importantes;
- metadata dinâmica;
- OpenGraph;
- canonical URLs;
- sitemap;
- robots.txt;
- slugs com ID;
- URLs amigáveis.

Rotas importantes:

```txt
/
 /anime/[id]/[slug]
 /episode/[id]/[slug]
 /today
 /seasonal
```

O padrão de URL deve ser:

```txt
/anime/1532/solo-leveling
/episode/8821/solo-leveling-episode-7
/u/douglas
```

Usar ID + slug para evitar colisão e permitir alteração de slug sem quebrar o sistema.

---

# 22. UI/UX V1

AniHype deve parecer:

- moderno;
- premium;
- cinematográfico;
- social;
- limpo;
- mobile-first.

Evitar:

- visual de fórum antigo;
- excesso de neon;
- poluição visual;
- animações exageradas;
- layout desktop-only.

## Cores

Base:

```txt
#0F1115
```

Cards:

```txt
#181C24
```

Accent:

```txt
#7C5CFF
#5B8CFF
```

Usar gradientes sutis.

## Tipografia

Preferir:

- Inter
- Geist

## Componentes

Usar:

- rounded-xl;
- rounded-2xl;
- sombras suaves;
- hover discreto;
- espaçamento limpo;
- transições elegantes.

---

# 23. Performance V1

Desde o início:

- otimizar imagens;
- usar lazy loading;
- paginar listas;
- evitar bundles gigantes;
- evitar renderizações desnecessárias;
- usar cache no backend quando fizer sentido;
- criar índices no banco;
- evitar queries pesadas sem paginação;
- preparar CDN futuro.

---

# 24. Segurança V1

Implementar:

- hash seguro de senha;
- JWT curto;
- refresh token seguro;
- CORS bem configurado;
- env validation;
- rate limit em auth;
- validação de input;
- sanitização de comentários;
- proteção contra XSS;
- proteção contra spam básico;
- roles e guards;
- não expor secrets no frontend.

---

# 25. Etapas de Implementação

Cursor deve seguir exatamente esta ordem.

---

## Etapa 1 — Setup do Monorepo

Criar:

- Turborepo;
- apps/web;
- apps/api;
- packages/ui;
- packages/types;
- packages/config;
- packages/eslint-config;
- packages/tsconfig;
- scripts;
- configs compartilhadas;
- ESLint;
- Prettier;
- TypeScript strict.

Resultado esperado:

- web roda;
- api roda;
- workspace funcionando;
- estrutura limpa.

---

## Etapa 2 — Setup do Backend

Criar:

- NestJS;
- Prisma;
- PostgreSQL;
- Docker compose;
- env validation;
- ConfigModule;
- PrismaModule;
- Logger;
- ValidationPipe global;
- Exception filter global;
- estrutura de common.

Resultado esperado:

- API sobe;
- banco conecta;
- Prisma funciona;
- health check responde.

---

## Etapa 3 — Schema Prisma Completo

Criar schema inicial com todas as tabelas principais.

Priorizar:

- users;
- roles;
- user_roles;
- refresh_tokens;
- anime;
- episodes;
- genres;
- studios;
- comments;
- comment_likes;
- badges;
- hype_transactions;
- follows;
- notifications;
- reports;
- premium_subscriptions;
- seasonal_highlights;
- admin_logs.

Criar:

- migrations;
- seeds de roles;
- seed de badges iniciais;
- índices;
- constraints;
- relations.

Resultado esperado:

- migration limpa;
- banco criado;
- seed executado;
- Prisma Client gerado.

---

## Etapa 4 — Auth

Implementar:

- register;
- login;
- logout;
- refresh;
- guards;
- roles;
- current user;
- hash de senha;
- refresh tokens persistidos.

Resultado esperado:

- usuário consegue cadastrar;
- usuário consegue logar;
- sessão persiste;
- rotas privadas funcionam.

---

## Etapa 5 — Anime Backend

Implementar:

- AnimeModule;
- AnimeService;
- AnimeRepository;
- endpoints públicos;
- endpoint por ID + slug;
- paginação;
- filtros básicos;
- busca básica;
- DTOs;
- normalização de slug.

Resultado esperado:

- listar anime;
- buscar anime;
- abrir anime por ID;
- retornar dados prontos para frontend.

---

## Etapa 6 — Episode Backend

Implementar:

- EpisodesModule;
- EpisodeService;
- EpisodeRepository;
- endpoints públicos;
- episódio por ID + slug;
- episódios por anime;
- calendário semanal;
- lançamentos de hoje.

Resultado esperado:

- homepage consegue buscar lançamentos;
- página de anime mostra episódios;
- página de episódio abre corretamente.

---

## Etapa 7 — Comments Backend

Implementar:

- CommentsModule;
- criar comentário;
- listar comentários por episódio;
- replies com parent_id;
- likes;
- spoiler flag;
- paginação;
- exclusão lógica;
- proteção auth.

Resultado esperado:

- usuário logado comenta;
- comentários aparecem no episódio;
- likes funcionam;
- spoiler funciona.

---

## Etapa 8 — Providers e Sync Básico

Implementar:

- ProvidersModule;
- AniList provider;
- Jikan provider;
- SyncModule básico;
- normalização de anime;
- normalização de episódio;
- salvar dados localmente;
- criar slug;
- criar registros de episódios;
- preparar discussion thread.

Resultado esperado:

- backend importa dados externos;
- frontend consome apenas backend;
- banco local vira fonte principal.

---

## Etapa 9 — Frontend Foundation

Criar:

- layout principal;
- theme;
- providers;
- TanStack Query;
- auth provider;
- API client;
- navbar;
- mobile navigation;
- containers;
- cards;
- buttons;
- inputs;
- modals;
- skeletons;
- empty states;
- error states.

Resultado esperado:

- UI base premium;
- mobile-first;
- componentes reutilizáveis.

---

## Etapa 10 — Homepage V1

Criar:

- hero carousel;
- today releases;
- weekly calendar;
- trending básico;
- loading states;
- empty states.

Resultado esperado:

- homepage funcional e bonita;
- foco claro no valor principal do AniHype.

---

## Etapa 11 — Anime Pages V1

Criar:

- rota `/anime/[id]/[slug]`;
- layout premium;
- banner;
- cover;
- synopsis;
- metadata;
- genres;
- studios;
- lista de episódios;
- SEO.

Resultado esperado:

- páginas de anime funcionais e indexáveis.

---

## Etapa 12 — Episode Pages V1

Criar:

- rota `/episode/[id]/[slug]`;
- informações do episódio;
- área de comentários;
- spoiler controls;
- comentários paginados;
- login prompt para comentar;
- SEO.

Resultado esperado:

- episódio vira centro de discussão.

---

## Etapa 13 — Perfil Básico

Criar:

- rota `/u/[username]`;
- avatar;
- nome;
- bio;
- badge principal se existir;
- hype level se existir;
- comentários recentes.

Resultado esperado:

- usuário já tem identidade básica.

---

## Etapa 14 — Admin Básico

Criar:

- área protegida;
- acesso por role;
- gestão simples de animes;
- gestão simples de episódios;
- gestão de hero carousel;
- remoção de comentários;
- logs básicos se possível.

Resultado esperado:

- plataforma pode ser operada manualmente.

---

## Etapa 15 — SEO, Polish e Launch Prep

Criar/refinar:

- sitemap;
- robots.txt;
- metadata;
- OpenGraph;
- canonical;
- responsividade;
- performance;
- loading states;
- empty states;
- error handling;
- deploy;
- SSL;
- env production;
- backups.

Resultado esperado:

- V1 pronta para publicação.

---

# 26. Critérios de Qualidade

Antes de considerar uma etapa pronta, verificar:

- o projeto compila;
- TypeScript não tem erro;
- lint passa;
- migrations rodam;
- seed funciona;
- endpoints têm DTO;
- endpoints têm validação;
- frontend trata loading;
- frontend trata erro;
- mobile está bom;
- não há `any` desnecessário;
- não há controller com regra pesada;
- não há chamada direta a provider externo no frontend;
- queries importantes têm paginação;
- dados sensíveis não vazam;
- nomes seguem padrão;
- código está separado por feature/módulo.

---

# 27. Cuidados Especiais para Cursor

Cursor deve tomar cuidado com:

- não criar tudo em um arquivo só;
- não misturar frontend e backend sem necessidade;
- não sair inventando features fora da V1;
- não quebrar a arquitetura para acelerar;
- não usar provider externo direto no frontend;
- não criar UI desktop-first;
- não ignorar mobile;
- não exagerar em animações;
- não criar visual poluído;
- não esquecer SEO;
- não esquecer paginação;
- não esquecer validação;
- não esquecer roles;
- não esquecer timestamps;
- não esquecer soft delete onde fizer sentido;
- não criar UUID como primary key principal;
- não criar tabela sem índice básico quando for consultada com frequência;
- não deixar comentários sem proteção contra spoiler;
- não deixar auth sem refresh token;
- não deixar admin sem proteção de role.

---

# 28. Regra de Ouro

A V1 deve ser pequena no frontend, mas forte na fundação.

Ou seja:

> Backend e banco preparados para o AniHype completo.  
> Frontend ativando apenas o necessário para validar o produto.

Essa estratégia permite lançar rápido sem criar uma base fraca.

---

# 29. Resultado Esperado da V1

Ao final da V1, o AniHype deve permitir:

- usuário cadastrar e logar;
- usuário ver o que lança hoje;
- usuário consultar calendário semanal;
- usuário abrir página de anime;
- usuário abrir página de episódio;
- usuário comentar em episódio;
- usuário marcar spoiler;
- usuário curtir comentário;
- admin gerenciar conteúdo básico;
- sistema importar dados de anime via backend;
- Google indexar páginas principais;
- projeto crescer para hype, badges, premium, notificações e eventos sem refatoração pesada.

---

# 30. Identidade Final

Mesmo na V1, o AniHype deve parecer:

> Uma plataforma moderna, premium e brasileira para acompanhar animes sazonais, discutir episódios e viver o hype semanal da comunidade.

Não criar apenas um CRUD.

Não criar apenas uma lista de anime.

Criar a base de uma comunidade viva.

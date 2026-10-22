# AniHype — Estado atual do projeto

**Atualizado em:** 21/10/2026, depois dos PRs #6 e #7 (já na `main`).
**Fonte da verdade:** este arquivo e o código. Os documentos antigos (`ESTADO-DO-PROJETO.md`, `SITUACAO-PROJETO.md`, `LEIA-ME-DEVS.md`, `planejamentodev.md`, `RESUMO-VPS.md`) são de maio e junho de 2026 e dizem coisas que já não valem, como "badges e rankings pendentes" e "perfil não editável".

## Combinado recente: o que já foi feito e o que falta

| Item | Situação |
| --- | --- |
| Busca de anime (Re:Zero e título fora do catálogo) | Feito e testado em produção. A busca ignora pontuação e, se o anime não existir no site, importa da AniList. |
| Importar a temporada quando a API sobe e ela está vazia | Feito. Se a temporada atual tiver menos de 5 animes, importa tudo cerca de 20 segundos depois da API subir. `SYNC_ON_BOOT=false` desliga. |
| Backup das fotos de perfil | Feito no código. Cada deploy gera uma cópia em `/home/deploy/backups/uploads` e agenda outra todo dia às 04:30. O registro fica em `/home/deploy/backups/backup.log`. |
| Documentação com o estado real | Este arquivo. |
| XP das ações previstas | Feito. Comentar, responder, receber curtida, avaliar, seguir anime e login diário. Há limite diário e a mesma ação não rende XP duas vezes. |
| Recuperar senha e confirmar e-mail | Telas e API prontas (`/esqueci-senha`, `/redefinir-senha`, `/verificar-email`). O envio ficou para depois: falta um servidor de e-mail (SMTP) na VPS. Sem isso, o botão não entrega a mensagem. |
| Trocar username | Deixado para depois. O perfil público é `/u/[username]` e ainda não há histórico nem redirecionamento do link antigo. |
| Sinopse em português | Feito. O HTML da AniList é limpo e o texto é traduzido para português. |

**Fora desse combinado, o site ainda não tem:** login com Google, busca de usuários, ligar e desligar notificações, recortar a foto antes de enviar, tela de boas-vindas, paginação melhor no feed, backup do banco e guardar as fotos fora da VPS.

---

## 1. O que é

Comunidade brasileira para acompanhar os animes da temporada: calendário, lançamentos do dia, página de cada anime e episódio, comentários com proteção contra spoiler, avaliações (Hypômetro), perfis, seguir pessoas e animes, XP, badges e rankings.

Domínios: `anihype.com.br` (site) e `api.anihype.com.br` (API).

## 2. Stack

| Parte | Tecnologia |
| --- | --- |
| Monorepo | Turborepo + npm workspaces |
| API (`apps/api`) | NestJS 10, Prisma, PostgreSQL |
| Site (`apps/web`) | Next.js 15 (App Router), Tailwind, TanStack Query, Zustand |
| Pacotes (`packages/*`) | `types`, `ui`, `config` |
| Produção | VPS com Nginx e PM2 (`anihype-api` na porta 3010, `anihype-web` na 3011) |

## 3. Como o código chega ao ar

1. Trabalhe numa **branch** e abra um **Pull Request** para `main`.
2. A **CI** (`.github/workflows/ci.yml`) roda no PR e na `main`: lint, tipos da API, testes da API e build.
3. Quando algo entra na `main` e a CI passa, o **deploy** (`.github/workflows/deploy.yml`) entra na VPS por SSH e executa `scripts/deploy-anihype.sh`. Esse script faz `git pull`, `npm install`, `npm run db:migrate`, build, reinicia a API e o site no PM2, testa as duas portas e recarrega o Nginx.
4. Não precisa mais rodar nada à mão na VPS. Mudou variável de ambiente? Edite `apps/api/.env` na VPS e rode o deploy de novo.

Rodar as checagens antes de subir: `npm run lint`, `npm run type-check -w @anihype/api`, `npm run type-check -w @anihype/web`, `npm run test -w @anihype/api`, `npm run build`.

## 4. O que está funcionando

**Conta e perfil**
- Cadastro, login (e-mail ou username), renovação de sessão e logout.
- Perfil público em `/u/[username]` com avatar, bio, badge equipado, Hype XP, Top 4 favoritos, animes seguidos e atividade.
- Edição do próprio perfil em `/perfil/editar`: nome de exibição, bio (300 caracteres) e foto. O **username não muda**.
- Foto: JPEG, PNG ou WebP até 3 MB, convertida para WebP 512 px, salva no disco da VPS.
- Esqueci a senha, redefinir senha e confirmar e-mail (seção 7).
- Barra do topo e menu do celular mostram a foto da pessoa.

**Top 4**
- No próprio perfil, o card vazio mostra **Editar**. O card preenchido mostra **Editar** e **Ver** ao passar o mouse (sempre visíveis no celular).
- Escolher outro anime substitui aquela posição na hora. Não existe mais "Salvar Top 4".

**Anime e episódios**
- Catálogo com filtros, busca, página do anime e do episódio, onde assistir, trailer, agenda.
- Busca ignora pontuação, espaço e maiúsculas ("Re:Zero" acha com "rezero"). Se o título ainda não existe no site, a API consulta a AniList e importa os resultados.
- Sinopses limpas (sem HTML) e traduzidas para português.
- "Lançamentos de Hoje" agrupa por anime ("Lançou do episódio X ao Y") e mostra "Lançado hoje" quando o horário já passou.

**Comunidade**
- Comentários e respostas, curtidas, spoiler, filtro de palavrões, denúncias.
- Avaliações por critério (animação, história, personagens, som, hype), review em destaque.
- Seguir usuários e animes, feed, notificações dentro do site.
- Hype XP, níveis, **8 badges** (conquista e equipar) e **rankings** de membros (semana, mês, geral) e de animes.

**Administração**
- Painel `/admin` para disparar importações, editar anime/episódio e gerenciar destaques da home.

## 5. Importação automática de animes

| Quando | O que faz |
| --- | --- |
| Todo dia 04:00 (Brasília) | Atualiza os animes **em exibição** da temporada atual |
| Todo domingo 03:00 (Brasília) | Importa a temporada **inteira** |
| Quando a API sobe | Se a temporada atual tiver menos de 5 animes, importa a temporada completa em segundo plano (20 s depois do boot) |
| Busca de um título que não existe | Importa os melhores resultados da AniList |

- Só roda um import de temporada por vez.
- `SYNC_ON_BOOT=false` desliga a importação ao subir.
- Animes com `isLocked` não têm capa, banner, trailer e horários sobrescritos.

## 6. Hype XP

| Ação | XP | Regra |
| --- | --- | --- |
| Comentar | 5 | até 10 por dia |
| Responder | 3 | até 10 por dia |
| Receber curtida | 2 | uma vez por pessoa em cada comentário, até 30 por dia |
| Avaliar anime | 10 | só na primeira avaliação daquele anime |
| Seguir anime | 5 | uma vez por anime, mesmo seguindo e desseguindo de novo |
| Login diário | 10 | uma vez por dia (fuso de Brasília), no login ou ao voltar com a sessão aberta |

O XP é concedido de forma idempotente, e uma falha nele nunca derruba a ação principal.

## 7. Senha e e-mail

- `POST /auth/forgot-password` (sempre responde igual, exista o e-mail ou não), `POST /auth/reset-password`, `POST /auth/verify-email` e `POST /auth/resend-verification`.
- Links valem **60 minutos** (senha) e **24 horas** (confirmação). O banco guarda só o hash do token, e cada token vale uma vez.
- Redefinir a senha encerra todas as sessões abertas.
- O cadastro envia o e-mail de confirmação, mas **não bloqueia** quem ainda não confirmou. A tela de editar perfil mostra um aviso com "Reenviar e-mail".
- Páginas: `/esqueci-senha`, `/redefinir-senha`, `/verificar-email`.
- **Precisa de SMTP configurado na VPS.** Sem `SMTP_HOST`, em desenvolvimento o link aparece no log da API, e em produção nada é enviado.

## 8. Arquivos de avatar e backup

- Os avatares ficam em `apps/api/uploads` (fora do Git) e são servidos em `https://api.anihype.com.br/uploads/...`. A classe `AvatarStorageService` isola o armazenamento, então trocar para R2 ou S3 mexe só nela.
- `scripts/backup-uploads.sh` compacta a pasta em `/home/deploy/backups/uploads`, mantém os 14 mais recentes e, se `BACKUP_REMOTE` existir, copia por rsync para outro servidor.
- O deploy agenda isso sozinho, todo dia às 04:30, e gera um backup na hora. O registro fica em `/home/deploy/backups/backup.log`.
- Um backup na mesma VPS não protege se a VPS inteira cair. Copie para outro lugar de vez em quando.

## 9. Variáveis de ambiente da API (`apps/api/.env`)

Obrigatórias: `DATABASE_URL`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`.

Produção: `NODE_ENV=production`, `CORS_ORIGIN`, `AVATAR_PUBLIC_URL=https://api.anihype.com.br/uploads`.

Novas: `WEB_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `SYNC_ON_BOOT`. Exemplos em `apps/api/.env.example`.

## 10. Ainda não existe

- Trocar de username (precisa de histórico e redirecionamento do link antigo).
- Login social (Google e outros).
- Busca global de usuários.
- Preferências de notificação (ligar/desligar) e notificação por e-mail.
- Recorte da foto antes de enviar.
- Onboarding para quem acabou de cadastrar.
- Feed com paginação por cursor.
- Backup do banco de dados dentro do repositório (hoje só avatares têm script).
- Armazenamento de avatares fora da VPS (R2 ou S3).

# AniHype — Integração com AniList e como popular o banco

Documento de apoio para entender como o site busca dados de anime e como importar a temporada atual.

---

## 1. O que é o AniList e como usamos

[AniList](https://anilist.co) é um banco de dados de animes com API GraphQL **pública e gratuita**.

**Não precisamos de cadastro, chave de API ou OAuth.** A API funciona com um simples `POST` para `https://graphql.anilist.co`.

### Fluxo de dados

```
AniList (GraphQL) ──▶ SyncService (NestJS) ──▶ PostgreSQL ──▶ Frontend
```

O frontend **nunca** chama o AniList diretamente. Tudo passa pelo nosso backend.

---

## 2. O que já está implementado

### Endpoints de sync (protegidos — precisa estar logado como ADMIN)

Base URL: `http://localhost:3001/api/v1/sync`

| Método | Endpoint | Body | O que faz |
|--------|----------|------|-----------|
| POST | `/sync/anilist` | `{ "anilistId": 154587 }` | Importa 1 anime pelo ID do AniList |
| POST | `/sync/mal` | `{ "malId": 16498 }` | Importa 1 anime pelo ID do MyAnimeList (via Jikan) |
| POST | `/sync/search` | `{ "search": "Frieren" }` | Busca no AniList e importa até 5 resultados |
| POST | `/sync/season` | ver abaixo | Importa **toda uma temporada** do AniList |
| GET  | `/sync/season/defaults` | — | Retorna a temporada atual (ex: SPRING 2026) |

### Body do `/sync/season`

```json
{
  "season": "SPRING",
  "seasonYear": 2026,
  "airingOnly": false,
  "delayMs": 400
}
```

- `season`: `WINTER` | `SPRING` | `SUMMER` | `FALL`
- `seasonYear`: ano (ex: 2026)
- `airingOnly`: `true` = só animes em exibição (RELEASING); `false` = todos da temporada
- `delayMs`: pausa entre cada anime em milissegundos (padrão 400ms — respeita rate limit do AniList)

---

## 3. Como usar o painel admin

### Pré-requisito: estar logado como admin

1. Acesse `http://localhost:3000/login`
2. Email: `anihype@gmail.com`
3. Senha: `AniHype1$`

> **Se limpou o cache do browser:** a sessão é perdida. Basta logar de novo — o banco não é afetado.

### Importar a temporada inteira (jeito mais fácil)

1. Acesse `http://localhost:3000/admin`
2. No topo da página: seção **"Importar temporada inteira"**
3. Selecione a temporada e o ano (já vem SPRING 2026 por padrão)
4. Clique **"Importar temporada"**
5. Aguarde 3–10 minutos (não feche a aba)
6. Ao finalizar, aparece um resumo: quantos foram encontrados, criados, atualizados, falhas

### Importar via linha de comando (recomendado para temporada inteira)

Mais rápido e não depende da aba do browser ficar aberta:

```powershell
# Na raiz do projeto (temporada atual automática)
npm run sync:season

# Temporada e ano específicos
npm run sync:season -- --season SPRING --year 2026

# Só animes em exibição
npm run sync:season -- --airing-only
```

### Importar anime individual

No painel `/admin`:
- **Sync por AniList ID**: cole o ID do AniList (ex: `154587` para Frieren)
- **Sync por MAL ID**: cole o ID do MyAnimeList
- **Buscar**: digite o nome (importa até 5 resultados)

---

## 4. Como achar o ID de um anime no AniList

Acesse [anilist.co](https://anilist.co), abra a página do anime e olhe a URL:

```
https://anilist.co/anime/154587/Sousou-no-Frieren/
                          ^^^^^^
                          ID = 154587
```

### IDs de animes populares para testar

| Anime | AniList ID | MAL ID |
|-------|-----------|--------|
| Frieren: Beyond Journey's End | 154587 | 52991 |
| Demon Slayer (temporada 1) | 101922 | 38000 |
| Attack on Titan (final) | 110277 | 51009 |
| Jujutsu Kaisen | 113415 | 40748 |
| One Piece | 21 | 21 |

---

## 5. Detalhes técnicos da integração

### Arquivos principais

| Arquivo | Função |
|---------|--------|
| `apps/api/src/modules/providers/anilist/anilist.service.ts` | Queries GraphQL para o AniList (busca, ID, temporada) |
| `apps/api/src/modules/providers/jikan/jikan.service.ts` | Busca no MyAnimeList via Jikan REST API |
| `apps/api/src/modules/sync/sync.service.ts` | Normaliza dados e faz upsert no banco |
| `apps/api/src/modules/sync/sync.controller.ts` | Endpoints HTTP de sync (protegidos por ADMIN) |
| `apps/api/scripts/sync-season.ts` | Script CLI para rodar sem subir servidor HTTP |

### O que o sync importa de cada anime

- Título (romaji, inglês, nativo)
- Sinopse
- Capa e banner
- Status, formato, fonte, temporada, ano
- Quantidade de episódios, duração
- Score e popularidade
- Trailer (YouTube)
- Gêneros (cria se não existir)
- Estúdios (cria se não existir)
- Episódios agendados (via `airingSchedule` do AniList)

O sync usa **upsert**: se o anime já existe pelo ID externo, atualiza; senão cria.

### Rate limit

- **AniList**: mais permissivo, mas usamos **400ms de pausa** entre cada anime no import em massa
- **Jikan (MAL)**: ~3 req/s — não usar para import em massa, só para sync individual

---

## 6. Por que a home pode aparecer vazia

As seções **"Lançamentos de hoje"** e **"Calendário"** leem episódios com `airDate` no banco.

Após rodar o `sync:season`, os episódios são importados e a home passa a mostrar conteúdo.

Se os episódios aparecerem vazios mesmo após o sync, é porque o AniList ainda não tem o `airingSchedule` completo para animes que ainda não estrearam. Eles são preenchidos automaticamente quando o AniList atualiza os dados.

---

## 7. Próximos passos sugeridos

- [ ] Rodar `npm run sync:season` para importar SPRING 2026 completo
- [ ] Verificar se a home mostra conteúdo após o import
- [ ] Configurar um cron para re-sync diário (atualiza episódios, scores, etc.)
- [ ] Adicionar suporte a sync de temporadas anteriores para catálogo histórico

---

## 8. Dúvidas frequentes

**Preciso de conta no AniList para usar a API?**
Não. A API pública do AniList funciona sem autenticação para leitura.

**O que acontece se rodar o sync duas vezes?**
Nada de errado — o sync é idempotente (upsert). Atualiza o que mudou, não duplica.

**Posso importar animes de outras temporadas?**
Sim. Use `--season WINTER --year 2025` no script CLI ou selecione no painel admin.

**O site quebrou ao limpar o cache do browser?**
O cache limpo apaga apenas a sessão do browser. O banco continua intacto. Só fazer login novamente.

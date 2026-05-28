/**
 * Import em massa da temporada via AniList (sem subir o servidor HTTP).
 *
 * Uso:
 *   npm run sync:season -w @anihype/api
 *   npm run sync:season -w @anihype/api -- --season SPRING --year 2026
 *   npm run sync:season -w @anihype/api -- --airing-only
 */
import { NestFactory } from '@nestjs/core';
import { AnimeSeason } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { SyncService } from '../src/modules/sync/sync.service';

function parseArgs(argv: string[]) {
  const defaults = SyncService.getCurrentSeason();
  let season = defaults.season;
  let seasonYear = defaults.seasonYear;
  let airingOnly = false;
  let delayMs = 400;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === '--season' && next) {
      season = next.toUpperCase() as AnimeSeason;
      i++;
    } else if ((arg === '--year' || arg === '--seasonYear') && next) {
      seasonYear = parseInt(next, 10);
      i++;
    } else if (arg === '--airing-only') {
      airingOnly = true;
    } else if (arg === '--delay' && next) {
      delayMs = parseInt(next, 10);
      i++;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Importa todos os animes de uma temporada do AniList para o PostgreSQL.

Opções:
  --season SPRING|SUMMER|FALL|WINTER   Temporada (default: atual)
  --year 2026                          Ano (default: atual)
  --airing-only                        Só animes em exibição (RELEASING)
  --delay 400                          Pausa entre animes em ms (default: 400)
`);
      process.exit(0);
    }
  }

  return { season, seasonYear, airingOnly, delayMs };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  console.log(
    `Importando ${options.season} ${options.seasonYear}` +
      (options.airingOnly ? ' (somente em exibição)' : '') +
      `…\n`,
  );

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const sync = app.get(SyncService);
    const result = await sync.syncSeason(options);

    console.log('\n--- Resumo ---');
    console.log(`Encontrados:  ${result.totalFound}`);
    console.log(`Importados:   ${result.synced}`);
    console.log(`Criados:      ${result.created}`);
    console.log(`Atualizados:  ${result.updated}`);
    console.log(`Falhas:       ${result.failed}`);

    if (result.errors.length > 0) {
      console.log('\nErros:');
      for (const e of result.errors) {
        console.log(`  - ${e.title} (${e.anilistId}): ${e.error}`);
      }
    }

    process.exit(result.failed > 0 ? 1 : 0);
  } finally {
    await app.close();
  }
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});

#!/usr/bin/env bash
# Fonte do deploy. O atalho /home/deploy/deploy-anihype.sh só puxa a main e executa este arquivo.
set -e

echo "=============================="
echo "🚀 DEPLOY ANIHYPE - INÍCIO"
echo "=============================="

ROOT_DIR="/home/deploy/projetos/anihype"
API_DIR="$ROOT_DIR/apps/api"
WEB_DIR="$ROOT_DIR/apps/web"

API_PM2="anihype-api"
WEB_PM2="anihype-web"

API_PORT="3010"
WEB_PORT="3011"

BRANCH="main"

echo ""
echo "🔄 ATUALIZANDO REPOSITÓRIO"
echo "------------------------------"

cd "$ROOT_DIR"

echo "📥 Git pull"
git pull origin "$BRANCH"

echo ""
echo "📦 INSTALANDO DEPENDÊNCIAS"
echo "------------------------------"

npm install

echo ""
echo "🔎 VALIDANDO ARQUIVOS DE AMBIENTE"
echo "------------------------------"

if [ -f "$API_DIR/.env" ]; then
  echo "✅ apps/api/.env encontrado"
else
  echo "❌ ERRO: apps/api/.env não encontrado"
  exit 1
fi

if [ -f "$WEB_DIR/.env.production" ]; then
  echo "✅ apps/web/.env.production encontrado"
elif [ -f "$WEB_DIR/.env.local" ]; then
  echo "✅ apps/web/.env.local encontrado"
elif [ -f "$WEB_DIR/.env" ]; then
  echo "✅ apps/web/.env encontrado"
else
  echo "❌ ERRO: nenhum arquivo de ambiente encontrado no frontend"
  exit 1
fi

echo ""
echo "🗄️ ATUALIZANDO BANCO"
echo "------------------------------"

cd "$ROOT_DIR"

echo "🗄️ Aplicando migrations"
npm run db:migrate

echo ""
echo "🏗️ BUILD DO MONOREPO"
echo "------------------------------"

npm run build

echo ""
echo "🚀 ATUALIZANDO API"
echo "------------------------------"

echo "🌍 Ambiente da API: production"
export NODE_ENV=production

if pm2 describe "$API_PM2" >/dev/null 2>&1; then
  echo "♻️ Reiniciando API"
  pm2 restart "$API_PM2" --update-env
else
  echo "▶️ Subindo API"
  pm2 start "$API_DIR/dist/main.js" \
    --name "$API_PM2" \
    --cwd "$API_DIR"
fi

echo ""
echo "🚀 ATUALIZANDO FRONTEND"
echo "------------------------------"

if pm2 describe "$WEB_PM2" >/dev/null 2>&1; then
  echo "♻️ Reiniciando frontend"
  pm2 restart "$WEB_PM2" --update-env
else
  echo "▶️ Subindo frontend na porta $WEB_PORT"
  pm2 start npm \
    --name "$WEB_PM2" \
    --cwd "$WEB_DIR" \
    -- start -- -p "$WEB_PORT"
fi

wait_http() {
  local url="$1"
  local extra="${2:-}"
  local tentativa
  for tentativa in $(seq 1 20); do
    if curl --fail --silent --max-time 5 $extra "$url" >/dev/null; then
      echo "$tentativa"
      return 0
    fi
    sleep 3
  done
  return 1
}

echo ""
echo "⏳ Aguardando a API ficar pronta..."

if tentativa=$(wait_http "http://127.0.0.1:$API_PORT/api/v1/health"); then
  echo "✅ API respondeu corretamente (tentativa $tentativa)"
else
  echo "❌ ERRO: API não respondeu"
  pm2 logs "$API_PM2" --lines 30 --nostream
  exit 1
fi

echo ""
echo "🧪 TESTANDO FRONTEND"
echo "------------------------------"

if tentativa=$(wait_http "http://127.0.0.1:$WEB_PORT" "--head"); then
  echo "✅ Frontend respondeu corretamente (tentativa $tentativa)"
else
  echo "❌ ERRO: frontend não respondeu"
  pm2 logs "$WEB_PM2" --lines 30 --nostream
  exit 1
fi

echo ""
echo "🧪 TESTANDO NGINX"
echo "------------------------------"

if sudo -n nginx -t; then
  echo "♻️ Recarregando nginx"
  sudo -n systemctl reload nginx
else
  echo "ℹ️ Nginx segue com a configuração atual"
fi

echo ""
echo "💾 SALVANDO ESTADO DO PM2"
echo "------------------------------"

pm2 save

echo ""
echo "=============================="
echo "✅ DEPLOY ANIHYPE FINALIZADO"
echo "=============================="

echo ""
pm2 list
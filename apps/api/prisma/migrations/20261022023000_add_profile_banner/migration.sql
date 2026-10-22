-- Fundo oficial do cabeçalho do perfil. Valor desconhecido volta para "original" na API.
ALTER TABLE "user_profiles" ADD COLUMN "profile_banner" VARCHAR(32) NOT NULL DEFAULT 'original';

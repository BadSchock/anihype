-- Contas que já existem ficam como concluídas e não veem a apresentação.
-- O cadastro novo grava "pending" na hora de criar o perfil.
ALTER TABLE "user_profiles" ADD COLUMN "onboarding_state" VARCHAR(16) NOT NULL DEFAULT 'done';

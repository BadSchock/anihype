-- CreateTable
CREATE TABLE "user_top_anime" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "anime_id" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_top_anime_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_top_anime_user_id_idx" ON "user_top_anime"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_top_anime_user_id_position_key" ON "user_top_anime"("user_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "user_top_anime_user_id_anime_id_key" ON "user_top_anime"("user_id", "anime_id");

-- AddForeignKey
ALTER TABLE "user_top_anime" ADD CONSTRAINT "user_top_anime_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_top_anime" ADD CONSTRAINT "user_top_anime_anime_id_fkey" FOREIGN KEY ("anime_id") REFERENCES "anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

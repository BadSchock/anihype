-- AlterTable
ALTER TABLE "anime" ADD COLUMN     "rating_animation" DECIMAL(4,2),
ADD COLUMN     "rating_average" DECIMAL(4,2),
ADD COLUMN     "rating_characters" DECIMAL(4,2),
ADD COLUMN     "rating_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rating_hype" DECIMAL(4,2),
ADD COLUMN     "rating_sound" DECIMAL(4,2),
ADD COLUMN     "rating_story" DECIMAL(4,2);

-- CreateTable
CREATE TABLE "anime_ratings" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "anime_id" INTEGER NOT NULL,
    "animation" INTEGER NOT NULL,
    "story" INTEGER NOT NULL,
    "characters" INTEGER NOT NULL,
    "sound" INTEGER NOT NULL,
    "hype" INTEGER NOT NULL,
    "final_score" DECIMAL(4,2) NOT NULL,
    "review_text" TEXT,
    "contains_spoiler" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "anime_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "anime_ratings_anime_id_deleted_at_idx" ON "anime_ratings"("anime_id", "deleted_at");

-- CreateIndex
CREATE INDEX "anime_ratings_user_id_deleted_at_idx" ON "anime_ratings"("user_id", "deleted_at");

-- CreateIndex
CREATE INDEX "anime_ratings_final_score_idx" ON "anime_ratings"("final_score");

-- CreateIndex
CREATE UNIQUE INDEX "anime_ratings_user_id_anime_id_key" ON "anime_ratings"("user_id", "anime_id");

-- CreateIndex
CREATE INDEX "anime_rating_average_rating_count_idx" ON "anime"("rating_average", "rating_count");

-- AddForeignKey
ALTER TABLE "anime_ratings" ADD CONSTRAINT "anime_ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anime_ratings" ADD CONSTRAINT "anime_ratings_anime_id_fkey" FOREIGN KEY ("anime_id") REFERENCES "anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

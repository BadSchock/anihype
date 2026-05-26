-- CreateEnum
CREATE TYPE "role_code" AS ENUM ('USER', 'PREMIUM', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "anime_status" AS ENUM ('AIRING', 'FINISHED', 'NOT_YET_AIRED', 'CANCELLED', 'HIATUS');

-- CreateEnum
CREATE TYPE "anime_format" AS ENUM ('TV', 'MOVIE', 'OVA', 'ONA', 'SPECIAL', 'MUSIC');

-- CreateEnum
CREATE TYPE "anime_season" AS ENUM ('WINTER', 'SPRING', 'SUMMER', 'FALL');

-- CreateEnum
CREATE TYPE "anime_source_kind" AS ENUM ('MANGA', 'LIGHT_NOVEL', 'ORIGINAL', 'VISUAL_NOVEL', 'GAME', 'NOVEL', 'DOUJINSHI', 'ANIME', 'OTHER');

-- CreateEnum
CREATE TYPE "episode_status" AS ENUM ('AIRED', 'UPCOMING', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "comment_publication_status" AS ENUM ('ACTIVE', 'REMOVED_BY_USER', 'REMOVED_BY_MOD', 'REMOVED_BY_ADMIN');

-- CreateEnum
CREATE TYPE "comment_moderation_status" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'FLAGGED', 'REVIEWED_HIDDEN');

-- CreateEnum
CREATE TYPE "oauth_provider_kind" AS ENUM ('GOOGLE', 'DISCORD');

-- CreateEnum
CREATE TYPE "report_target_type" AS ENUM ('COMMENT', 'USER', 'ANIME', 'EPISODE', 'OTHER');

-- CreateEnum
CREATE TYPE "report_subject_status" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "external_provider_kind" AS ENUM ('ANILIST', 'JIKAN', 'MYANIMELIST', 'ANIDB', 'KITSU', 'OTHER');

-- CreateEnum
CREATE TYPE "anime_image_kind" AS ENUM ('COVER_SMALL', 'COVER_MEDIUM', 'COVER_LARGE', 'BANNER', 'FANART');

-- CreateEnum
CREATE TYPE "user_activity_kind" AS ENUM ('PAGE_VIEW', 'COMMENT_CREATE', 'COMMENT_LIKE', 'LOGIN', 'PROFILE_UPDATE', 'ANIME_VIEW', 'EPISODE_VIEW', 'FOLLOW_USER', 'FOLLOW_ANIME');

-- CreateEnum
CREATE TYPE "hype_transaction_reason" AS ENUM ('COMMENT_POSTED', 'REPLY_POSTED', 'LIKE_RECEIVED', 'DAILY_LOGIN', 'BONUS_ADMIN', 'EVENT', 'PENALTY');

-- CreateEnum
CREATE TYPE "subscription_status_kind" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "notification_channel_kind" AS ENUM ('IN_APP', 'EMAIL', 'PUSH');

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "code" "role_code" NOT NULL,
    "description" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "username" VARCHAR(64) NOT NULL,
    "password_hash" VARCHAR(255),
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verified_at" TIMESTAMP(3),
    "display_name" VARCHAR(120),
    "avatar_url" TEXT,
    "bio" VARCHAR(2000),
    "oauth_provider" "oauth_provider_kind",
    "oauth_subject" VARCHAR(255),
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token_hash" VARCHAR(128) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "ip_address" VARCHAR(64),
    "user_agent" VARCHAR(512),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token_hash" VARCHAR(128) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token_hash" VARCHAR(128) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "genres" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "genres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "studios" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "studios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anime" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(280) NOT NULL,
    "title_romaji" VARCHAR(500) NOT NULL,
    "title_english" VARCHAR(500),
    "title_native" VARCHAR(500),
    "synopsis" TEXT,
    "cover_image_url" TEXT,
    "banner_image_url" TEXT,
    "status" "anime_status" NOT NULL DEFAULT 'NOT_YET_AIRED',
    "format" "anime_format",
    "source" "anime_source_kind",
    "season" "anime_season",
    "season_year" INTEGER,
    "episode_count" INTEGER,
    "episode_duration" INTEGER,
    "average_score" DECIMAL(5,2),
    "popularity_score" INTEGER,
    "trailer_url" TEXT,
    "is_adult" BOOLEAN NOT NULL DEFAULT false,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "anime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episodes" (
    "id" SERIAL NOT NULL,
    "anime_id" INTEGER NOT NULL,
    "slug" VARCHAR(320) NOT NULL,
    "number" INTEGER NOT NULL,
    "title" VARCHAR(500),
    "synopsis" TEXT,
    "thumbnail_url" TEXT,
    "air_date" TIMESTAMP(3),
    "air_time_utc" TIMESTAMP(3),
    "duration_minutes" INTEGER,
    "delay_reason" VARCHAR(500),
    "status" "episode_status" NOT NULL DEFAULT 'UNKNOWN',
    "score_average" DECIMAL(5,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "episodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anime_genres" (
    "id" SERIAL NOT NULL,
    "anime_id" INTEGER NOT NULL,
    "genre_id" INTEGER NOT NULL,

    CONSTRAINT "anime_genres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anime_studios" (
    "id" SERIAL NOT NULL,
    "anime_id" INTEGER NOT NULL,
    "studio_id" INTEGER NOT NULL,
    "role" VARCHAR(120),

    CONSTRAINT "anime_studios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seasonal_highlights" (
    "id" SERIAL NOT NULL,
    "anime_id" INTEGER NOT NULL,
    "season" "anime_season",
    "year" INTEGER,
    "title" VARCHAR(300),
    "subtitle" VARCHAR(300),
    "image_url" TEXT,
    "cta_label" VARCHAR(120),
    "destination" VARCHAR(500),
    "hero_position" INTEGER NOT NULL DEFAULT 0,
    "is_featured" BOOLEAN NOT NULL DEFAULT true,
    "spoiler_safe" BOOLEAN NOT NULL DEFAULT true,
    "visible_from" TIMESTAMP(3),
    "visible_until" TIMESTAMP(3),
    "published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seasonal_highlights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anime_external_ids" (
    "id" SERIAL NOT NULL,
    "anime_id" INTEGER NOT NULL,
    "provider" "external_provider_kind" NOT NULL,
    "external_id" VARCHAR(128) NOT NULL,
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anime_external_ids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anime_images" (
    "id" SERIAL NOT NULL,
    "anime_id" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "kind" "anime_image_kind" NOT NULL DEFAULT 'FANART',
    "width" INTEGER,
    "height" INTEGER,
    "spoiler_safe" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anime_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "streaming_platforms" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "homepage_url" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "streaming_platforms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anime_streaming_platforms" (
    "id" SERIAL NOT NULL,
    "anime_id" INTEGER NOT NULL,
    "platform_id" INTEGER NOT NULL,
    "url" VARCHAR(1000) NOT NULL,
    "region_code" VARCHAR(8),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anime_streaming_platforms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" SERIAL NOT NULL,
    "episode_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "parent_id" INTEGER,
    "content" TEXT NOT NULL,
    "is_spoiler" BOOLEAN NOT NULL DEFAULT false,
    "status" "comment_publication_status" NOT NULL DEFAULT 'ACTIVE',
    "moderation_status" "comment_moderation_status" NOT NULL DEFAULT 'APPROVED',
    "edited_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_likes" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "comment_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_reports" (
    "id" SERIAL NOT NULL,
    "reporter_id" INTEGER NOT NULL,
    "comment_id" INTEGER NOT NULL,
    "reason" VARCHAR(1000) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" SERIAL NOT NULL,
    "target_type" "report_target_type" NOT NULL,
    "target_id" INTEGER NOT NULL,
    "subject_status" "report_subject_status" NOT NULL DEFAULT 'OPEN',
    "anime_id" INTEGER,
    "episode_id" INTEGER,
    "author_user_id" INTEGER,
    "assigned_moderator_user_id" INTEGER,
    "description" TEXT NOT NULL,
    "resolution_notes" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spoiler_settings" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "auto_blur_recent_episodes" BOOLEAN NOT NULL DEFAULT true,
    "spoiler_safe_mode" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spoiler_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_follows" (
    "id" SERIAL NOT NULL,
    "follower_id" INTEGER NOT NULL,
    "following_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anime_follows" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "anime_id" INTEGER NOT NULL,
    "episode_focus_id" INTEGER,
    "notify_on_episode" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anime_follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "hype_xp" INTEGER NOT NULL DEFAULT 0,
    "hype_level_id" INTEGER,
    "equipped_badge_id" INTEGER,
    "location" VARCHAR(120),
    "website" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_activity" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "activity" "user_activity_kind" NOT NULL,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hype_levels" (
    "id" SERIAL NOT NULL,
    "tier_order" INTEGER NOT NULL,
    "min_xp" INTEGER NOT NULL,
    "display_name" VARCHAR(120),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hype_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "icon_url" VARCHAR(1000),
    "rarity_color" VARCHAR(32),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "badge_id" INTEGER NOT NULL,
    "acquired_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_equipped" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hype_transactions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "delta_points" INTEGER NOT NULL,
    "reason" "hype_transaction_reason" NOT NULL,
    "reference_id" INTEGER,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hype_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "premium_subscriptions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "status" "subscription_status_kind" NOT NULL DEFAULT 'ACTIVE',
    "plan_key" VARCHAR(120) NOT NULL,
    "provider" VARCHAR(64) NOT NULL,
    "provider_sub_id" VARCHAR(255),
    "current_period_end" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "premium_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_slots" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "title" VARCHAR(255),
    "width" INTEGER,
    "height" INTEGER,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "channel" "notification_channel_kind" NOT NULL DEFAULT 'IN_APP',
    "topic" VARCHAR(160) NOT NULL,
    "body" TEXT NOT NULL,
    "payload" JSONB,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "mute_email" BOOLEAN NOT NULL DEFAULT false,
    "mute_push" BOOLEAN NOT NULL DEFAULT false,
    "mute_episodes" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_logs" (
    "id" SERIAL NOT NULL,
    "actor_user_id" INTEGER,
    "action_key" VARCHAR(160) NOT NULL,
    "target_type" VARCHAR(80) NOT NULL,
    "target_id" INTEGER,
    "metadata" JSONB,
    "ip_address" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_logs" (
    "id" SERIAL NOT NULL,
    "moderator_user_id" INTEGER,
    "action" VARCHAR(160) NOT NULL,
    "target_type" VARCHAR(80) NOT NULL,
    "target_id" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE INDEX "users_oauth_provider_oauth_subject_idx" ON "users"("oauth_provider", "oauth_subject");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_key" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE INDEX "email_verification_tokens_user_id_idx" ON "email_verification_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "genres_name_key" ON "genres"("name");

-- CreateIndex
CREATE UNIQUE INDEX "genres_slug_key" ON "genres"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "studios_name_key" ON "studios"("name");

-- CreateIndex
CREATE UNIQUE INDEX "studios_slug_key" ON "studios"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "anime_slug_key" ON "anime"("slug");

-- CreateIndex
CREATE INDEX "anime_status_season_season_year_idx" ON "anime"("status", "season", "season_year");

-- CreateIndex
CREATE INDEX "anime_deleted_at_idx" ON "anime"("deleted_at");

-- CreateIndex
CREATE INDEX "anime_title_romaji_idx" ON "anime"("title_romaji");

-- CreateIndex
CREATE INDEX "episodes_air_date_idx" ON "episodes"("air_date");

-- CreateIndex
CREATE INDEX "episodes_air_time_utc_idx" ON "episodes"("air_time_utc");

-- CreateIndex
CREATE INDEX "episodes_status_idx" ON "episodes"("status");

-- CreateIndex
CREATE INDEX "episodes_deleted_at_idx" ON "episodes"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "episodes_anime_id_number_key" ON "episodes"("anime_id", "number");

-- CreateIndex
CREATE UNIQUE INDEX "episodes_anime_id_slug_key" ON "episodes"("anime_id", "slug");

-- CreateIndex
CREATE INDEX "anime_genres_genre_id_idx" ON "anime_genres"("genre_id");

-- CreateIndex
CREATE UNIQUE INDEX "anime_genres_anime_id_genre_id_key" ON "anime_genres"("anime_id", "genre_id");

-- CreateIndex
CREATE INDEX "anime_studios_studio_id_idx" ON "anime_studios"("studio_id");

-- CreateIndex
CREATE UNIQUE INDEX "anime_studios_anime_id_studio_id_key" ON "anime_studios"("anime_id", "studio_id");

-- CreateIndex
CREATE INDEX "seasonal_highlights_published_hero_position_idx" ON "seasonal_highlights"("published", "hero_position");

-- CreateIndex
CREATE INDEX "seasonal_highlights_season_year_idx" ON "seasonal_highlights"("season", "year");

-- CreateIndex
CREATE INDEX "anime_external_ids_anime_id_idx" ON "anime_external_ids"("anime_id");

-- CreateIndex
CREATE UNIQUE INDEX "anime_external_ids_provider_external_id_key" ON "anime_external_ids"("provider", "external_id");

-- CreateIndex
CREATE INDEX "anime_images_anime_id_sort_order_idx" ON "anime_images"("anime_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "streaming_platforms_slug_key" ON "streaming_platforms"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "streaming_platforms_name_key" ON "streaming_platforms"("name");

-- CreateIndex
CREATE INDEX "anime_streaming_platforms_platform_id_idx" ON "anime_streaming_platforms"("platform_id");

-- CreateIndex
CREATE UNIQUE INDEX "anime_streaming_platforms_anime_id_platform_id_key" ON "anime_streaming_platforms"("anime_id", "platform_id");

-- CreateIndex
CREATE INDEX "comments_episode_id_parent_id_created_at_idx" ON "comments"("episode_id", "parent_id", "created_at");

-- CreateIndex
CREATE INDEX "comments_user_id_idx" ON "comments"("user_id");

-- CreateIndex
CREATE INDEX "comments_deleted_at_idx" ON "comments"("deleted_at");

-- CreateIndex
CREATE INDEX "comment_likes_comment_id_idx" ON "comment_likes"("comment_id");

-- CreateIndex
CREATE UNIQUE INDEX "comment_likes_user_id_comment_id_key" ON "comment_likes"("user_id", "comment_id");

-- CreateIndex
CREATE INDEX "comment_reports_comment_id_idx" ON "comment_reports"("comment_id");

-- CreateIndex
CREATE INDEX "reports_target_type_target_id_idx" ON "reports"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "reports_subject_status_idx" ON "reports"("subject_status");

-- CreateIndex
CREATE UNIQUE INDEX "spoiler_settings_user_id_key" ON "spoiler_settings"("user_id");

-- CreateIndex
CREATE INDEX "user_follows_following_id_idx" ON "user_follows"("following_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_follows_follower_id_following_id_key" ON "user_follows"("follower_id", "following_id");

-- CreateIndex
CREATE INDEX "anime_follows_anime_id_idx" ON "anime_follows"("anime_id");

-- CreateIndex
CREATE UNIQUE INDEX "anime_follows_user_id_anime_id_key" ON "anime_follows"("user_id", "anime_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE INDEX "user_profiles_hype_xp_idx" ON "user_profiles"("hype_xp" DESC);

-- CreateIndex
CREATE INDEX "user_activity_user_id_created_at_idx" ON "user_activity"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "hype_levels_tier_order_key" ON "hype_levels"("tier_order");

-- CreateIndex
CREATE UNIQUE INDEX "badges_name_key" ON "badges"("name");

-- CreateIndex
CREATE UNIQUE INDEX "badges_slug_key" ON "badges"("slug");

-- CreateIndex
CREATE INDEX "user_badges_badge_id_idx" ON "user_badges"("badge_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_user_id_badge_id_key" ON "user_badges"("user_id", "badge_id");

-- CreateIndex
CREATE INDEX "hype_transactions_user_id_created_at_idx" ON "hype_transactions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "premium_subscriptions_user_id_idx" ON "premium_subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "premium_subscriptions_status_idx" ON "premium_subscriptions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ad_slots_slug_key" ON "ad_slots"("slug");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "notification_preferences"("user_id");

-- CreateIndex
CREATE INDEX "admin_logs_actor_user_id_created_at_idx" ON "admin_logs"("actor_user_id", "created_at");

-- CreateIndex
CREATE INDEX "moderation_logs_moderator_user_id_created_at_idx" ON "moderation_logs"("moderator_user_id", "created_at");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_anime_id_fkey" FOREIGN KEY ("anime_id") REFERENCES "anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anime_genres" ADD CONSTRAINT "anime_genres_anime_id_fkey" FOREIGN KEY ("anime_id") REFERENCES "anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anime_genres" ADD CONSTRAINT "anime_genres_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anime_studios" ADD CONSTRAINT "anime_studios_anime_id_fkey" FOREIGN KEY ("anime_id") REFERENCES "anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anime_studios" ADD CONSTRAINT "anime_studios_studio_id_fkey" FOREIGN KEY ("studio_id") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seasonal_highlights" ADD CONSTRAINT "seasonal_highlights_anime_id_fkey" FOREIGN KEY ("anime_id") REFERENCES "anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anime_external_ids" ADD CONSTRAINT "anime_external_ids_anime_id_fkey" FOREIGN KEY ("anime_id") REFERENCES "anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anime_images" ADD CONSTRAINT "anime_images_anime_id_fkey" FOREIGN KEY ("anime_id") REFERENCES "anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anime_streaming_platforms" ADD CONSTRAINT "anime_streaming_platforms_anime_id_fkey" FOREIGN KEY ("anime_id") REFERENCES "anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anime_streaming_platforms" ADD CONSTRAINT "anime_streaming_platforms_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "streaming_platforms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_reports" ADD CONSTRAINT "comment_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_reports" ADD CONSTRAINT "comment_reports_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_anime_id_fkey" FOREIGN KEY ("anime_id") REFERENCES "anime"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_assigned_moderator_user_id_fkey" FOREIGN KEY ("assigned_moderator_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spoiler_settings" ADD CONSTRAINT "spoiler_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anime_follows" ADD CONSTRAINT "anime_follows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anime_follows" ADD CONSTRAINT "anime_follows_anime_id_fkey" FOREIGN KEY ("anime_id") REFERENCES "anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anime_follows" ADD CONSTRAINT "anime_follows_episode_focus_id_fkey" FOREIGN KEY ("episode_focus_id") REFERENCES "episodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_hype_level_id_fkey" FOREIGN KEY ("hype_level_id") REFERENCES "hype_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_equipped_badge_id_fkey" FOREIGN KEY ("equipped_badge_id") REFERENCES "badges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_activity" ADD CONSTRAINT "user_activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hype_transactions" ADD CONSTRAINT "hype_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "premium_subscriptions" ADD CONSTRAINT "premium_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_logs" ADD CONSTRAINT "moderation_logs_moderator_user_id_fkey" FOREIGN KEY ("moderator_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

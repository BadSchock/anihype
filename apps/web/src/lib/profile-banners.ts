/** Mesmos ids validados em apps/api/src/modules/users/profile-banners.ts. */
export const PROFILE_BANNERS = [
  { id: 'original', name: 'Original' },
  { id: 'neon', name: 'Neon' },
  { id: 'cosmic', name: 'Cósmico' },
] as const;

export type ProfileBannerId = (typeof PROFILE_BANNERS)[number]['id'];

export const DEFAULT_PROFILE_BANNER: ProfileBannerId = 'original';

export function resolveProfileBanner(stored: string | null | undefined): ProfileBannerId {
  const match = PROFILE_BANNERS.find((banner) => banner.id === stored);
  return match?.id ?? DEFAULT_PROFILE_BANNER;
}

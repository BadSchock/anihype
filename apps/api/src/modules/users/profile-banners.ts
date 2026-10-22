/**
 * Catálogo oficial de fundos do perfil.
 * O cliente só envia o id. A API recusa qualquer outro valor.
 *
 * access:
 * - free: qualquer membro pode equipar
 * - level | achievement | event | pro: reservado. Ainda não há desbloqueio,
 *   então canEquipProfileBanner recusa. Não cadastre um fundo desses
 *   até a regra de conquista existir no backend.
 */
export type ProfileBannerAccess = 'free' | 'level' | 'achievement' | 'event' | 'pro';

export interface ProfileBannerDefinition {
  id: string;
  name: string;
  access: ProfileBannerAccess;
}

export const PROFILE_BANNERS = [
  { id: 'original', name: 'Original', access: 'free' },
  { id: 'neon', name: 'Neon', access: 'free' },
  { id: 'cosmic', name: 'Cósmico', access: 'free' },
] as const satisfies readonly ProfileBannerDefinition[];

export type ProfileBannerId = (typeof PROFILE_BANNERS)[number]['id'];

export const DEFAULT_PROFILE_BANNER: ProfileBannerId = 'original';

export const EQUIPABLE_PROFILE_BANNER_IDS: ProfileBannerId[] = PROFILE_BANNERS.filter(
  (banner) => banner.access === 'free',
).map((banner) => banner.id);

export function canEquipProfileBanner(id: string): id is ProfileBannerId {
  return EQUIPABLE_PROFILE_BANNER_IDS.some((bannerId) => bannerId === id);
}

/** Fundo salvo inválido ou ainda não liberado volta para o padrão. */
export function resolveProfileBanner(stored: string | null | undefined): ProfileBannerId {
  if (stored && canEquipProfileBanner(stored)) return stored;
  return DEFAULT_PROFILE_BANNER;
}

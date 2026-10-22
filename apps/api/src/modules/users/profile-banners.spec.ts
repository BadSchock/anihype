import {
  canEquipProfileBanner,
  DEFAULT_PROFILE_BANNER,
  resolveProfileBanner,
} from './profile-banners';

describe('fundos de perfil', () => {
  it('libera só os três fundos gratuitos', () => {
    expect(canEquipProfileBanner('original')).toBe(true);
    expect(canEquipProfileBanner('neon')).toBe(true);
    expect(canEquipProfileBanner('cosmic')).toBe(true);
  });

  it('recusa valor desconhecido, CSS e um fundo que ainda não existe', () => {
    expect(canEquipProfileBanner('linear-gradient(red,blue)')).toBe(false);
    expect(canEquipProfileBanner('https://evil.example/bg.png')).toBe(false);
    expect(canEquipProfileBanner('pro-galaxy')).toBe(false);
    expect(canEquipProfileBanner('')).toBe(false);
  });

  it('mantém o roxo original quando não há seleção ou o valor salvo é inválido', () => {
    expect(resolveProfileBanner(null)).toBe(DEFAULT_PROFILE_BANNER);
    expect(resolveProfileBanner(undefined)).toBe('original');
    expect(resolveProfileBanner('não-existe')).toBe('original');
    expect(resolveProfileBanner('cosmic')).toBe('cosmic');
  });
});

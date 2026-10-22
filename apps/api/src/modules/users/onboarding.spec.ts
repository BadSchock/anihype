import { isSettableOnboardingState, resolveOnboardingState } from './onboarding';

describe('onboarding', () => {
  it('trata conta antiga ou valor desconhecido como já concluído', () => {
    expect(resolveOnboardingState(null)).toBe('done');
    expect(resolveOnboardingState(undefined)).toBe('done');
    expect(resolveOnboardingState('qualquer')).toBe('done');
    expect(resolveOnboardingState('done')).toBe('done');
  });

  it('preserva apresentação pendente e adiada', () => {
    expect(resolveOnboardingState('pending')).toBe('pending');
    expect(resolveOnboardingState('later')).toBe('later');
  });

  it('não deixa o cliente voltar o estado para pendente', () => {
    expect(isSettableOnboardingState('later')).toBe(true);
    expect(isSettableOnboardingState('done')).toBe(true);
    expect(isSettableOnboardingState('pending')).toBe(false);
  });
});
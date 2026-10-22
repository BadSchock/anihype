export const ONBOARDING_STATES = ['pending', 'later', 'done'] as const;

export type OnboardingState = (typeof ONBOARDING_STATES)[number];

/** Estados que o próprio usuário pode gravar. "pending" só nasce no cadastro. */
export const SETTABLE_ONBOARDING_STATES = ['later', 'done'] as const;

export type SettableOnboardingState = (typeof SETTABLE_ONBOARDING_STATES)[number];

export function resolveOnboardingState(stored: string | null | undefined): OnboardingState {
  if (stored === 'pending' || stored === 'later' || stored === 'done') return stored;
  return 'done';
}

export function isSettableOnboardingState(value: string): value is SettableOnboardingState {
  return value === 'later' || value === 'done';
}

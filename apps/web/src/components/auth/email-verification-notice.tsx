'use client';

import { useState } from 'react';
import { resendEmailVerification } from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';

/** Aparece só para quem ainda não confirmou o e-mail. */
export function EmailVerificationNotice() {
  const emailVerified = useAuthStore((state) => state.user?.emailVerified);
  const email = useAuthStore((state) => state.user?.email);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  if (emailVerified !== false) return null;

  async function handleResend() {
    setPending(true);
    setFeedback(null);
    try {
      const res = await resendEmailVerification();
      setFeedback({ ok: true, text: res.message });
    } catch (err) {
      setFeedback({
        ok: false,
        text: err instanceof Error ? err.message : 'Não foi possível reenviar agora.',
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mb-5 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm">
      <p className="font-medium text-yellow-300">Confirme seu e-mail</p>
      <p className="mt-1 text-muted-foreground">
        Enviamos um link para {email ?? 'o seu e-mail'}. Ele protege sua conta e permite recuperar a senha.
      </p>
      <button
        type="button"
        onClick={() => void handleResend()}
        disabled={pending}
        className="mt-2 text-purple-400 hover:underline disabled:opacity-50"
      >
        {pending ? 'Enviando...' : 'Reenviar e-mail'}
      </button>
      {feedback && (
        <p className={`mt-2 text-xs ${feedback.ok ? 'text-green-400' : 'text-red-400'}`}>{feedback.text}</p>
      )}
    </div>
  );
}

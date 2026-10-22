'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mascot } from '@/components/brand/mascot';
import { EmailVerificationNotice } from '@/components/auth/email-verification-notice';
import { UserAvatar } from '@/components/user/user-avatar';
import { useAuthHydrated } from '@/hooks/use-auth-hydrated';
import { useUpdateProfile, useUploadAvatar } from '@/hooks/use-update-profile';
import { buildLoginUrl } from '@/lib/auth-url';
import { getPublicProfile } from '@/services/api';

const BIO_MAX = 300;
const DISPLAY_NAME_MAX = 120;
const AVATAR_MAX_BYTES = 3 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function EditProfilePage() {
  const router = useRouter();
  const { authReady, isAuthenticated, user } = useAuthHydrated();

  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [initialDisplayName, setInitialDisplayName] = useState('');
  const [initialBio, setInitialBio] = useState('');
  const [initialized, setInitialized] = useState(false);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Redireciona visitantes/deslogados — esta tela só existe para o próprio usuário.
  useEffect(() => {
    if (authReady && !isAuthenticated) {
      router.replace(buildLoginUrl('/perfil/editar'));
    }
  }, [authReady, isAuthenticated, router]);

  // Pré-preenche o formulário com os dados atuais da sessão (uma única vez).
  useEffect(() => {
    if (!initialized && authReady && user) {
      setDisplayName(user.displayName ?? '');
      setInitialDisplayName(user.displayName ?? '');
      setInitialized(true);
    }
  }, [authReady, user, initialized]);

  // Bio não está no AuthUser da sessão (não aparece no header) — busca no
  // perfil público, que já expõe esse campo publicamente.
  useEffect(() => {
    if (!user?.username) return;
    let cancelled = false;

    void getPublicProfile(user.username).then((profile) => {
      if (!cancelled) {
        setBio(profile.bio ?? '');
        setInitialBio(profile.bio ?? '');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [user?.username]);

  // Libera a URL do preview ao trocar de imagem/desmontar (evita memory leak).
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite selecionar o mesmo arquivo de novo depois de cancelar
    if (!file) return;

    setAvatarError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setAvatarError('Envie uma imagem JPEG, PNG ou WebP.');
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setAvatarError('A imagem deve ter no máximo 3MB.');
      return;
    }

    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function cancelAvatarChange() {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSuccess(false);

    const trimmedName = displayName.trim();
    const trimmedBio = bio.trim();

    const hasTextChanges =
      trimmedName !== initialDisplayName.trim() || trimmedBio !== initialBio.trim();
    const hasAvatarChange = !!avatarFile;

    if (!hasTextChanges && !hasAvatarChange) {
      setFormError('Nenhuma alteração para salvar.');
      return;
    }

    let step: 'text' | 'avatar' | null = null;

    try {
      if (hasTextChanges) {
        step = 'text';
        await updateProfile.mutateAsync({ displayName: trimmedName, bio: trimmedBio });
        setInitialDisplayName(trimmedName);
        setInitialBio(trimmedBio);
      }

      if (hasAvatarChange && avatarFile) {
        step = 'avatar';
        await uploadAvatar.mutateAsync(avatarFile);
      }

      setSuccess(true);
      cancelAvatarChange();

      const finalUsername = user?.username;
      window.setTimeout(() => {
        router.push(finalUsername ? `/u/${finalUsername}` : '/');
      }, 900);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido.';

      if (step === 'avatar' && hasTextChanges) {
        setFormError(
          `Nome e bio foram salvos, mas o avatar não pôde ser enviado: ${message}`,
        );
      } else if (step === 'avatar') {
        setFormError(`Não foi possível enviar o avatar: ${message}`);
      } else {
        setFormError(`Não foi possível salvar as alterações: ${message}`);
      }
    }
  }

  const isSaving = updateProfile.isPending || uploadAvatar.isPending;

  if (!authReady || !user) {
    return (
      <div className="mx-auto mt-10 max-w-md">
        <div className="h-96 animate-pulse rounded-2xl border border-border bg-card" />
      </div>
    );
  }

  return (
    <div className="mx-auto mt-10 max-w-md">
      <Mascot size="sm" className="mb-1" />

      <div className="rounded-2xl border border-border bg-card p-8">
        <h1 className="mb-1 text-2xl font-bold text-foreground">Editar perfil</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Essas informações aparecem no seu perfil público.
        </p>

        <EmailVerificationNotice />

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <UserAvatar
              name={displayName || user.username}
              avatarUrl={avatarPreview ?? user.avatarUrl}
              size="xl"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-ghost px-3 py-1.5 text-xs"
              >
                Alterar foto
              </button>
              {avatarFile && (
                <button
                  type="button"
                  onClick={cancelAvatarChange}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancelar foto
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            {avatarFile && (
              <p className="text-[11px] text-muted-foreground">
                Pré-visualização — a imagem só é enviada ao salvar.
              </p>
            )}
            {avatarError && (
              <p className="text-xs text-red-400">{avatarError}</p>
            )}
          </div>

          {/* Nome de exibição */}
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Nome de exibição</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={DISPLAY_NAME_MAX}
              placeholder="Como quer ser chamado"
              className="input-base"
            />
          </div>

          {/* Username (somente leitura) */}
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Username</label>
            <input
              value={user.username}
              disabled
              readOnly
              className="input-base cursor-not-allowed opacity-60"
            />
            <p className="mt-1 text-xs text-muted-foreground/70">
              O username ainda não pode ser alterado.
            </p>
          </div>

          {/* Bio */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-sm text-muted-foreground">Bio</label>
              <span className="text-[11px] tabular-nums text-muted-foreground/70">
                {bio.length}/{BIO_MAX}
              </span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
              maxLength={BIO_MAX}
              rows={4}
              placeholder="Conte um pouco sobre você..."
              className="input-base resize-none"
            />
          </div>

          {formError && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {formError}
            </p>
          )}

          {success && (
            <p className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-400">
              Perfil salvo com sucesso! Voltando para o seu perfil...
            </p>
          )}

          <div className="mt-1 flex items-center gap-2">
            <button
              type="submit"
              disabled={isSaving || !!avatarError}
              className="btn-primary flex-1 py-2.5"
            >
              {isSaving ? 'Salvando...' : 'Salvar alterações'}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/u/${user.username}`)}
              disabled={isSaving}
              className="rounded-xl bg-muted px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

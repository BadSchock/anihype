import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicProfile } from '@/services/api';

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  try {
    const user = await getPublicProfile(username);
    return {
      title: `${user.displayName ?? user.username} (@${user.username})`,
      description: user.bio ?? `Perfil de ${user.username} no AniHype`,
    };
  } catch {
    return { title: 'Usuário não encontrado' };
  }
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params;

  let user;
  try {
    user = await getPublicProfile(username);
  } catch {
    notFound();
  }

  const joinedAt = new Date(user.createdAt).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header do perfil */}
      <div className="flex flex-col items-center gap-4 py-10 text-center sm:flex-row sm:text-left">
        {/* Avatar */}
        <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/30 text-3xl font-bold text-purple-300">
          {(user.displayName ?? user.username).charAt(0).toUpperCase()}
        </div>

        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground">
            {user.displayName ?? user.username}
          </h1>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
          <p className="mt-1 text-xs text-muted-foreground">Membro desde {joinedAt}</p>
        </div>
      </div>

      {/* Bio */}
      {user.bio && (
        <div className="rounded-xl bg-muted p-4">
          <p className="text-sm leading-relaxed text-foreground/80">{user.bio}</p>
        </div>
      )}

      {/* Placeholder para atividade futura */}
      <div className="mt-8 rounded-xl border border-border bg-muted p-6 text-center text-sm text-muted-foreground">
        Atividade recente do usuário em breve.
      </div>
    </div>
  );
}

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicProfile } from '@/services/api';
import { UserAvatar } from '@/components/user/user-avatar';
import { ProfileClient } from './_components/profile-client';
import { ProfileHeaderActions } from './_components/profile-header-actions';
import { ProfileSocialStats } from '@/components/profile/profile-social-stats';

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

  const displayName = user.displayName ?? user.username;
  const joinedAt = new Date(user.createdAt).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="relative h-28 bg-gradient-to-br from-purple-600/30 via-purple-900/20 to-background">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.25),transparent_55%)]" />
        </div>

        <div className="relative px-6 pb-6">
          <div className="-mt-12 flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:justify-between sm:text-left">
            <UserAvatar
              name={displayName}
              avatarUrl={user.avatarUrl}
              size="xl"
              className="ring-4 ring-card"
            />

            <div className="flex flex-1 flex-col gap-1 pb-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
                {user.equippedBadge && (
                  <span
                    className="rounded-full border px-2 py-0.5 text-xs font-semibold"
                    style={{
                      borderColor: `${user.equippedBadge.rarityColor ?? '#A855F7'}66`,
                      color: user.equippedBadge.rarityColor ?? '#A855F7',
                      backgroundColor: `${user.equippedBadge.rarityColor ?? '#A855F7'}18`,
                    }}
                  >
                    {user.equippedBadge.name}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
              <p className="text-xs text-muted-foreground">Membro desde {joinedAt}</p>
              <ProfileSocialStats username={user.username} />
            </div>

            <ProfileHeaderActions username={user.username} userId={user.id} />
          </div>

          {user.bio && (
            <p className="mt-5 text-sm leading-relaxed text-foreground/80">{user.bio}</p>
          )}
        </div>
      </div>

      {/* Top 4 + atividade futura — client porque precisa saber se é o dono */}
      <ProfileClient username={user.username} userId={user.id} />
    </div>
  );
}

export type AvatarKind = 'emoji' | 'image';

export interface AvatarOption {
  id: number;
  name: string;
  badge: string;
  unlocked: boolean;
  unlockLevel?: number;
  kind: AvatarKind;
  emoji?: string;
  src?: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 0, name: 'Scout', badge: 'DEFAULT', unlocked: true, kind: 'emoji', emoji: '🏃' },
  { id: 1, name: 'Strategist', badge: 'DEFAULT', unlocked: true, kind: 'emoji', emoji: '🧠' },
  { id: 2, name: 'Oracle', badge: 'Unlocks Lv10', unlocked: false, unlockLevel: 10, kind: 'emoji', emoji: '🔮' },
  { id: 3, name: 'Architect', badge: 'Unlocks Lv25', unlocked: false, unlockLevel: 25, kind: 'emoji', emoji: '⚡' },
  { id: 4, name: 'Phantom', badge: '100 Predictions', unlocked: false, unlockLevel: 100, kind: 'emoji', emoji: '👻' },
  { id: 5, name: 'Girl Hoodie', badge: 'NEW', unlocked: true, kind: 'image', src: '/avatars/avatar-girl-hoodie.png' },
  { id: 6, name: 'Bee Hoodie', badge: 'NEW', unlocked: true, kind: 'image', src: '/avatars/avatar-bee-hoodie.jpeg' },
  { id: 7, name: 'Smiling Hero', badge: 'NEW', unlocked: true, kind: 'image', src: '/avatars/avatar-boy-smile.jpeg' },
  { id: 8, name: 'Sparkle Star', badge: 'NEW', unlocked: true, kind: 'image', src: '/avatars/avatar-girl-sparkles.jpeg' },
  { id: 9, name: 'Red Sailor', badge: 'NEW', unlocked: true, kind: 'image', src: '/avatars/avatar-red-sailor.jpeg' },
  { id: 10, name: 'Dark Catgirl', badge: 'NEW', unlocked: true, kind: 'image', src: '/avatars/avatar-dark-catgirl.jpeg' },
  { id: 11, name: 'Rose School', badge: 'Unlocks Lv8', unlocked: false, unlockLevel: 8, kind: 'image', src: '/avatars/avatar-rose-school.jpeg' },
  { id: 12, name: 'Bear Hoodie', badge: 'Unlocks Lv14', unlocked: false, unlockLevel: 14, kind: 'image', src: '/avatars/avatar-bear-hoodie.jpeg' },
  { id: 13, name: 'Campus Boy', badge: 'Unlocks Lv18', unlocked: false, unlockLevel: 18, kind: 'image', src: '/avatars/avatar-campus-boy.jpeg' },
];

export const getAvatarOption = (avatarId?: number | null) =>
  AVATAR_OPTIONS.find((avatar) => avatar.id === (avatarId ?? 0)) ?? AVATAR_OPTIONS[0];

export const getAvatarLabel = (avatarId?: number | null) => getAvatarOption(avatarId).name;

export const isAvatarUnlocked = (avatar: AvatarOption, userLevel = 0) =>
  avatar.unlocked || (typeof avatar.unlockLevel === 'number' && userLevel >= avatar.unlockLevel);

const LAST_AVATAR_KEY = 'newsquest_last_avatar_id';

const isValidAvatarId = (avatarId: number | null | undefined): avatarId is number =>
  typeof avatarId === 'number' && AVATAR_OPTIONS.some((avatar) => avatar.id === avatarId);

export const getStoredAvatarId = () => {
  const stored = localStorage.getItem(LAST_AVATAR_KEY);
  if (stored === null) return null;

  const parsed = Number.parseInt(stored, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

export const setStoredAvatarId = (avatarId: number) => {
  localStorage.setItem(LAST_AVATAR_KEY, String(avatarId));
};

export const getLastActiveAvatarId = () => {
  const stored = getStoredAvatarId();
  return isValidAvatarId(stored) ? stored : null;
};

export const getDefaultAvatarId = (userLevel = 0) =>
  getLastActiveAvatarId() ??
  AVATAR_OPTIONS.find((avatar) => avatar.kind === 'image' && isAvatarUnlocked(avatar, userLevel))?.id ??
  AVATAR_OPTIONS.find((avatar) => isAvatarUnlocked(avatar, userLevel))?.id ??
  0;

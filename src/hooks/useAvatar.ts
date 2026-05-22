const AVATAR_PALETTE = [
  'bg-rose-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-cyan-500',
  'bg-sky-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-fuchsia-500',
  'bg-pink-500',
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0; // force int32
  }
  return Math.abs(hash);
}

export function getInitials(fullName?: string | null, email?: string | null): string {
  if (fullName && fullName.trim()) {
    const parts = fullName.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
    return (first + last).toUpperCase().slice(0, 2);
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return '?';
}

export function getAvatarColorClass(seed?: string | null): string {
  if (!seed) return 'bg-muted';
  const idx = hashString(seed) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[idx] ?? 'bg-muted';
}

export const AUTH_INPUT_CLASSNAME =
  "w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-slate-100 outline-none transition-all placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30";

export const AUTH_CARD_CLASSNAME =
  "w-full max-w-md rounded-2xl border border-slate-800/80 bg-slate-900/60 p-8 backdrop-blur-xl";

export type AuthAlert = {
  type: "error" | "success";
  message: string;
};

export type UserMetadata = {
  full_name?: string;
  gym_name?: string;
};

export function getUserDisplayName(metadata: UserMetadata | undefined): string {
  return metadata?.full_name?.trim() || "Manager";
}

export function getUserGymName(metadata: UserMetadata | undefined): string {
  return metadata?.gym_name?.trim() || "Sports Salle";
}

export function getUserInitials(metadata: UserMetadata | undefined): string {
  const name = getUserDisplayName(metadata);
  const parts = name.split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "M";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

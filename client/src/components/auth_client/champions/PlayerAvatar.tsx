import { imageUrl } from "../../../lib/cloudinary";

interface PlayerAvatarProps {
  name: string;
  photo?: { url: string } | null;
  /** Rendered size in px (the image is fetched at 2× for sharp screens). */
  size?: number;
  className?: string;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "?";

/** Player photo, or their initials when no photo was uploaded. */
const PlayerAvatar = ({
  name,
  photo,
  size = 40,
  className = "",
}: PlayerAvatarProps) => (
  <span
    className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-black ${className}`}
    style={{ width: size, height: size, fontSize: Math.max(10, size * 0.36) }}
  >
    {photo?.url ? (
      <img
        src={imageUrl(photo.url, size * 2)}
        alt={name}
        loading="lazy"
        className="w-full h-full object-cover"
      />
    ) : (
      <span aria-hidden="true">{initials(name)}</span>
    )}
  </span>
);

export default PlayerAvatar;

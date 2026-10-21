import crypto from "crypto";

/**
 * Cloudinary without the SDK: the browser uploads directly to Cloudinary
 * with a short-lived signature from us, so images never pass through the
 * (size-limited) serverless API. We only store the resulting URL.
 */

const config = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  return cloudName && apiKey && apiSecret
    ? { cloudName, apiKey, apiSecret }
    : null;
};

export const cloudinaryEnabled = () => !!config();

/** Cloudinary signature: sorted "k=v&k=v" + secret, SHA-1. */
const sign = (params: Record<string, string | number>, secret: string) =>
  crypto
    .createHash("sha1")
    .update(
      Object.keys(params)
        .sort()
        .map((k) => `${k}=${params[k]}`)
        .join("&") + secret,
    )
    .digest("hex");

export const UPLOAD_FOLDERS = {
  player: "sports-portal/players",
  news: "sports-portal/news",
} as const;

export type UploadKind = keyof typeof UPLOAD_FOLDERS;

/** Parameters the browser posts to Cloudinary along with the file. */
export const signUpload = (kind: UploadKind) => {
  const cfg = config();
  if (!cfg) return null;
  const params = {
    folder: UPLOAD_FOLDERS[kind],
    timestamp: Math.floor(Date.now() / 1000),
  };
  return {
    cloudName: cfg.cloudName,
    apiKey: cfg.apiKey,
    ...params,
    signature: sign(params, cfg.apiSecret),
  };
};

/** Only accept images stored in our own Cloudinary folders. */
export const isOwnImage = (url: unknown, publicId: unknown) => {
  const cfg = config();
  if (!cfg || typeof url !== "string" || typeof publicId !== "string")
    return false;
  const base = `https://res.cloudinary.com/${cfg.cloudName}/image/upload/`;
  return (
    url.startsWith(base) &&
    Object.values(UPLOAD_FOLDERS).some((f) => publicId.startsWith(`${f}/`))
  );
};

/** Best-effort delete of a replaced image; never throws. */
export const destroyImage = async (publicId?: string) => {
  const cfg = config();
  if (!cfg || !publicId) return;
  try {
    const params = {
      public_id: publicId,
      timestamp: Math.floor(Date.now() / 1000),
    };
    const body = new URLSearchParams({
      ...Object.fromEntries(
        Object.entries(params).map(([k, v]) => [k, String(v)]),
      ),
      api_key: cfg.apiKey,
      signature: sign(params, cfg.apiSecret),
    });
    await fetch(
      `https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/destroy`,
      { method: "POST", body },
    );
  } catch (error) {
    console.error("[Cloudinary] destroy failed:", error);
  }
};

import api from "../services/api";

export interface UploadedImage {
  url: string;
  publicId: string;
}

interface Signature {
  cloudName: string;
  apiKey: string;
  folder: string;
  timestamp: number;
  signature: string;
}

/**
 * Uploads an image straight to Cloudinary using a signature from our API,
 * so the file never passes through the serverless function.
 */
export const uploadImage = async (
  file: Blob,
  kind: "player" | "news",
): Promise<UploadedImage> => {
  const { data: sig } = await api.post<Signature>("/uploads/signature", {
    kind,
  });
  const body = new FormData();
  body.append("file", file);
  body.append("api_key", sig.apiKey);
  body.append("folder", sig.folder);
  body.append("timestamp", String(sig.timestamp));
  body.append("signature", sig.signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
    { method: "POST", body },
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message || "Upload failed");
  return { url: json.secure_url, publicId: json.public_id };
};

/**
 * Resized, auto-format/quality variant of a Cloudinary image, e.g.
 * imageUrl(url, 96) → square face-centred thumbnail. Other URLs pass through.
 */
export const imageUrl = (url: string | undefined, size: number) => {
  if (!url) return undefined;
  const marker = "/image/upload/";
  const i = url.indexOf(marker);
  if (i === -1 || !url.includes("res.cloudinary.com")) return url;
  const t = `c_fill,g_face,w_${size},h_${size},f_auto,q_auto`;
  return (
    url.slice(0, i + marker.length) + t + "/" + url.slice(i + marker.length)
  );
};

/** Crops `src` to `area` and returns a square JPEG of at most `max` px. */
export const cropToBlob = async (
  src: string,
  area: { x: number; y: number; width: number; height: number },
  max = 800,
): Promise<Blob> => {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
  const size = Math.min(max, Math.round(area.width));
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  canvas
    .getContext("2d")!
    .drawImage(
      image,
      area.x,
      area.y,
      area.width,
      area.height,
      0,
      0,
      size,
      size,
    );
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Crop failed"))),
      "image/jpeg",
      0.9,
    ),
  );
};

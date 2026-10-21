import { useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { toast } from "react-hot-toast";
import Modal from "../../../ui/Modal";
import { cropToBlob, imageUrl, uploadImage } from "../../../../lib/cloudinary";
import {
  errorMessage,
  useDeleteNewsPostMutation,
  useGetNewsPostQuery,
  useSaveNewsPostMutation,
  type MatchSummary,
  type NewsCategory,
  type NewsInput,
} from "../../../../store/api";
import { CATEGORY_LABEL } from "./newsMeta";

interface NewsEditorModalProps {
  competitionId: string;
  competitionSlug: string;
  /** Existing post to edit; omit to write a new one. */
  postId?: string;
  /** Starting content for a new post (e.g. a match report draft). */
  prefill?: NewsInput;
  matches: MatchSummary[];
  onClose: () => void;
}

const field =
  "w-full min-w-0 px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-[#DD1D25]/40";
const label = "block text-xs font-bold text-zinc-600 dark:text-zinc-300 mb-1.5";

const EMPTY: NewsInput = {
  title: "",
  category: "announcement",
  summary: "",
  body: "",
  cover: null,
  match: null,
};

const NewsEditorModal = ({
  competitionId,
  competitionSlug,
  postId,
  prefill,
  matches,
  onClose,
}: NewsEditorModalProps) => {
  const { data: existing, isLoading } = useGetNewsPostQuery(
    { competitionId, postId: postId! },
    { skip: !postId },
  );
  const [form, setForm] = useState<NewsInput>({ ...EMPTY, ...prefill });
  const loaded = useRef(false);
  useEffect(() => {
    if (!existing || loaded.current) return;
    loaded.current = true;
    setForm({
      title: existing.title,
      category: existing.category,
      summary: existing.summary ?? "",
      body: existing.body ?? "",
      cover: existing.cover ?? null,
      match: existing.match ?? null,
    });
  }, [existing]);

  const [save, { isLoading: saving }] = useSaveNewsPostMutation();
  const [remove, { isLoading: deleting }] = useDeleteNewsPostMutation();
  const published = existing?.status === "published";

  // Cover cropping happens inline (a nested modal would fight over Escape).
  const fileInput = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);
  useEffect(
    () => () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
    },
    [cropSrc],
  );

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropSrc(URL.createObjectURL(file));
  };

  const confirmCrop = async () => {
    if (!cropSrc || !area) return;
    setUploading(true);
    try {
      const cover = await uploadImage(
        await cropToBlob(cropSrc, area, 1600),
        "news",
      );
      setForm((f) => ({ ...f, cover }));
      setCropSrc(null);
    } catch (err) {
      toast.error(errorMessage(err, (err as Error).message || "Upload failed"));
    } finally {
      setUploading(false);
    }
  };

  const submit = async (status: "draft" | "published") => {
    if (!form.title?.trim() || form.title.trim().length < 3) {
      toast.error("Add a headline (at least 3 characters)");
      return;
    }
    try {
      const post = await save({
        competitionId,
        postId,
        data: { ...form, title: form.title.trim(), status },
      }).unwrap();
      toast.success(
        status === "published"
          ? published
            ? "Post updated"
            : "Post published"
          : "Draft saved",
      );
      if (status === "published") {
        toast(
          (t) => (
            <a
              href={`/champions-league/${competitionSlug}/news/${post.slug}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => toast.dismiss(t.id)}
              className="font-bold underline"
            >
              View the article ↗
            </a>
          ),
          { duration: 5000 },
        );
      }
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't save the post"));
    }
  };

  const destroy = async () => {
    if (!postId || !window.confirm("Delete this post? This can't be undone."))
      return;
    try {
      await remove({ competitionId, postId }).unwrap();
      toast.success("Post deleted");
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't delete the post"));
    }
  };

  const busy = saving || deleting || uploading;

  return (
    <Modal
      isOpen
      onClose={cropSrc ? () => setCropSrc(null) : onClose}
      title={cropSrc ? "Cover image" : postId ? "Edit post" : "New post"}
      size="xl"
    >
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFile}
      />

      {cropSrc ? (
        <div className="space-y-4">
          <div className="relative h-72 sm:h-96 rounded-xl overflow-hidden bg-zinc-900">
            <Cropper
              image={cropSrc}
              crop={crop}
              zoom={zoom}
              aspect={16 / 9}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, px) => setArea(px)}
            />
          </div>
          <label className="flex items-center gap-3 text-xs font-bold text-zinc-500">
            Zoom
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-[#DD1D25]"
            />
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setCropSrc(null)}
              disabled={uploading}
              className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmCrop}
              disabled={uploading || !area}
              className="flex-1 py-3 bg-[#DD1D25] text-white font-bold rounded-xl hover:bg-[#C41920] disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Use image"}
            </button>
          </div>
        </div>
      ) : postId && isLoading ? (
        <div className="h-72 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit("published");
          }}
          className="space-y-4"
        >
          <div>
            <span className={label}>Cover image</span>
            {form.cover ? (
              <div className="relative rounded-xl overflow-hidden aspect-video bg-zinc-100 dark:bg-zinc-800">
                <img
                  src={imageUrl(form.cover.url, 960, 540)}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 right-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-black/60 text-white hover:bg-black/80"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, cover: null }))}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-black/60 text-white hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="w-full aspect-[16/5] rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-500 hover:border-[#DD1D25]/50 hover:text-[#DD1D25] transition-colors"
              >
                + Add a cover image (16:9)
              </button>
            )}
          </div>

          <div>
            <label htmlFor="news-title" className={label}>
              Headline
            </label>
            <input
              id="news-title"
              value={form.title ?? ""}
              maxLength={140}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={`${field} text-base font-bold`}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="news-category" className={label}>
                Category
              </label>
              <select
                id="news-category"
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as NewsCategory })
                }
                className={field}
              >
                {Object.entries(CATEGORY_LABEL).map(([value, text]) => (
                  <option key={value} value={value}>
                    {text}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="news-match" className={label}>
                Linked match{" "}
                <span className="font-normal text-zinc-400">
                  (shows its score and timeline)
                </span>
              </label>
              <select
                id="news-match"
                value={form.match ?? ""}
                onChange={(e) =>
                  setForm({ ...form, match: e.target.value || null })
                }
                className={field}
              >
                <option value="">None</option>
                {matches.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.home.name} v {m.away.name}
                    {m.status !== "scheduled" && m.score ? ` · ${m.score}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="news-summary" className={label}>
              Summary{" "}
              <span className="font-normal text-zinc-400">
                (shown on news cards)
              </span>
            </label>
            <input
              id="news-summary"
              value={form.summary ?? ""}
              maxLength={300}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              className={field}
            />
          </div>

          <div>
            <label htmlFor="news-body" className={label}>
              Article{" "}
              <span className="font-normal text-zinc-400">
                (leave a blank line between paragraphs)
              </span>
            </label>
            <textarea
              id="news-body"
              rows={12}
              maxLength={20000}
              value={form.body ?? ""}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className={`${field} leading-relaxed`}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              {postId && (
                <button
                  type="button"
                  onClick={destroy}
                  disabled={busy}
                  className="px-3 py-2 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  Delete
                </button>
              )}
              {existing && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${published ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"}`}
                >
                  {published ? "Published" : "Draft"}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => submit("draft")}
                disabled={busy}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50"
              >
                {published ? "Unpublish" : "Save draft"}
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-[#DD1D25] text-white hover:bg-[#C41920] disabled:opacity-50"
              >
                {saving ? "Saving…" : published ? "Update" : "Publish"}
              </button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default NewsEditorModal;

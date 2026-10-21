import { Request, Response } from "express";
import mongoose from "mongoose";
import Competition from "../models/Competition.js";
import Match from "../models/Match.js";
import NewsPost, { INewsPost } from "../models/NewsPost.js";
import { destroyImage, isOwnImage } from "../utils/cloudinary.js";

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const handle =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  async (req: Request, res: Response) => {
    try {
      await fn(req, res);
    } catch (error) {
      if (error instanceof HttpError) {
        return res.status(error.status).json({ message: error.message });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  };

const LIST_FIELDS =
  "title slug category summary cover match status publishedAt createdAt updatedAt";

const ensureCompetition = async (id: string) => {
  if (!mongoose.isValidObjectId(id) || !(await Competition.exists({ _id: id })))
    throw new HttpError(404, "Competition not found");
};

const findPost = async (competitionId: string, postId: string) => {
  if (!mongoose.isValidObjectId(postId))
    throw new HttpError(404, "Post not found");
  const post = await NewsPost.findOne({
    _id: postId,
    competition: competitionId,
  });
  if (!post) throw new HttpError(404, "Post not found");
  return post;
};

const slugify = (title: string) =>
  title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "post";

/** "match-report", "match-report-2", ... unique within the competition. */
const uniqueSlug = async (
  competitionId: unknown,
  title: string,
  except?: unknown,
) => {
  const base = slugify(title);
  for (let n = 1; ; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    const taken = await NewsPost.exists({
      competition: competitionId,
      slug,
      ...(except ? { _id: { $ne: except } } : {}),
    });
    if (!taken) return slug;
  }
};

type PostInput = Partial<
  Pick<INewsPost, "title" | "category" | "summary" | "body" | "status">
> & {
  cover?: { url: string; publicId: string } | null;
  match?: string | null;
};

/** Applies validated input; returns the cover public id it replaced, if any. */
const apply = async (post: INewsPost, input: PostInput) => {
  if (input.cover && !isOwnImage(input.cover.url, input.cover.publicId)) {
    throw new HttpError(
      400,
      "Cover images must be uploaded through the portal",
    );
  }
  if (input.match) {
    const ok = await Match.exists({
      _id: input.match,
      competition: post.competition,
    });
    if (!ok) throw new HttpError(400, "That match isn't in this competition");
  }

  let replaced: string | undefined;
  if (
    input.cover !== undefined &&
    input.cover?.publicId !== post.cover?.publicId
  ) {
    replaced = post.cover?.publicId;
    post.cover = input.cover ?? undefined;
  }
  if (input.title !== undefined && input.title !== post.title) {
    post.title = input.title;
    // Keep links stable once published; drafts follow their title.
    if (post.status === "draft" || !post.slug)
      post.slug = await uniqueSlug(post.competition, input.title, post._id);
  }
  for (const key of ["category", "summary", "body"] as const) {
    if (input[key] !== undefined) (post as any)[key] = input[key];
  }
  if (input.match !== undefined) post.match = (input.match as any) || null;
  if (input.status !== undefined && input.status !== post.status) {
    post.status = input.status;
    if (input.status === "published" && !post.publishedAt)
      post.publishedAt = new Date();
  }
  return replaced;
};

/* ───────────────────────────── Admin ───────────────────────────── */

// @desc    All posts, drafts included, newest first
// @route   GET /api/competitions/:id/news
export const listNews = handle(async (req, res) => {
  await ensureCompetition(req.params.id);
  const posts = await NewsPost.find({ competition: req.params.id })
    .select(LIST_FIELDS)
    .sort({ createdAt: -1 })
    .lean();
  res.json(posts);
});

// @route   GET /api/competitions/:id/news/:postId
export const getNews = handle(async (req, res) => {
  res.json(await findPost(req.params.id, req.params.postId));
});

// @route   POST /api/competitions/:id/news
export const createNews = handle(async (req, res) => {
  await ensureCompetition(req.params.id);
  const post = new NewsPost({
    competition: req.params.id,
    title: req.body.title,
    slug: await uniqueSlug(req.params.id, req.body.title),
    author: req.user?._id,
  });
  await apply(post, req.body);
  await post.save();
  res.status(201).json(post);
});

// @route   PUT /api/competitions/:id/news/:postId
export const updateNews = handle(async (req, res) => {
  const post = await findPost(req.params.id, req.params.postId);
  const replaced = await apply(post, req.body);
  await post.save();
  await destroyImage(replaced);
  res.json(post);
});

// @route   DELETE /api/competitions/:id/news/:postId
export const deleteNews = handle(async (req, res) => {
  const post = await findPost(req.params.id, req.params.postId);
  await post.deleteOne();
  await destroyImage(post.cover?.publicId);
  res.json({ message: "Post deleted" });
});

/* ───────────────────────────── Public ───────────────────────────── */

const publicCompetitionId = async (slug: string) => {
  const c = await Competition.findOne({ formSlug: String(slug).toLowerCase() })
    .select("_id")
    .lean();
  if (!c) throw new HttpError(404, "Competition not found");
  return c._id;
};

// @desc    Published posts, newest first (?limit, ?before for paging)
// @route   GET /api/competitions/public/:slug/news
export const listPublicNews = handle(async (req, res) => {
  const competition = await publicCompetitionId(req.params.slug);
  const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 50);
  const before = req.query.before ? new Date(String(req.query.before)) : null;
  const posts = await NewsPost.find({
    competition,
    status: "published",
    ...(before && !isNaN(+before) ? { publishedAt: { $lt: before } } : {}),
  })
    .select(LIST_FIELDS)
    .sort({ publishedAt: -1 })
    .limit(limit + 1)
    .lean();
  res.json({ posts: posts.slice(0, limit), hasMore: posts.length > limit });
});

// @route   GET /api/competitions/public/:slug/news/:postSlug
export const getPublicNews = handle(async (req, res) => {
  const competition = await publicCompetitionId(req.params.slug);
  const post = await NewsPost.findOne({
    competition,
    slug: req.params.postSlug,
    status: "published",
  })
    .select("-author")
    .lean();
  if (!post) throw new HttpError(404, "Post not found");
  res.json(post);
});

/** Removes a competition's posts and their cover images. */
export const deleteCompetitionNews = async (competitionId: unknown) => {
  const posts = await NewsPost.find({ competition: competitionId }).select(
    "cover",
  );
  await NewsPost.deleteMany({ competition: competitionId });
  await Promise.all(posts.map((p) => destroyImage(p.cover?.publicId)));
};

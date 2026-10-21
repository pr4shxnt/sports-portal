import mongoose, { Document, Schema } from "mongoose";

/** A Champions League news article (plain-text body, optional match link). */
export const NEWS_CATEGORIES = [
  "match_report",
  "announcement",
  "feature",
] as const;
export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

export interface INewsPost extends Document {
  competition: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  category: NewsCategory;
  summary?: string;
  body: string;
  cover?: { url: string; publicId: string };
  match?: mongoose.Types.ObjectId | null;
  status: "draft" | "published";
  publishedAt?: Date;
  author?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NewsPostSchema = new Schema<INewsPost>(
  {
    competition: {
      type: Schema.Types.ObjectId,
      ref: "Competition",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true },
    category: { type: String, enum: NEWS_CATEGORIES, default: "announcement" },
    summary: { type: String, trim: true },
    body: { type: String, default: "" },
    cover: {
      type: new Schema(
        { url: { type: String, required: true }, publicId: String },
        { _id: false },
      ),
      default: undefined,
    },
    match: { type: Schema.Types.ObjectId, ref: "Match", default: null },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    publishedAt: Date,
    author: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

NewsPostSchema.index({ competition: 1, slug: 1 }, { unique: true });
NewsPostSchema.index({ competition: 1, status: 1, publishedAt: -1 });

export default mongoose.model<INewsPost>("NewsPost", NewsPostSchema);

import mongoose, { Document, Schema } from "mongoose";

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  author: Schema.Types.ObjectId;
  targetRole?: string; // Optional: restrict who sees it
}

const AnnouncementSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetRole: { type: String },
  },
  { timestamps: true },
);

export default mongoose.model<IAnnouncement>(
  "Announcement",
  AnnouncementSchema,
);

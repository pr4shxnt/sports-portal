import mongoose, { Schema } from "mongoose";
const AnnouncementSchema = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetRole: { type: String },
    comments: [
        {
            userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
            response: { type: String, required: true },
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now },
        },
    ],
    reactions: [
        {
            emoji: { type: String, required: true },
            users: [{ type: Schema.Types.ObjectId, ref: "User" }],
        },
    ],
}, { timestamps: true });
export default mongoose.model("Announcement", AnnouncementSchema);

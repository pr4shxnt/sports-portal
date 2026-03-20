import mongoose, { Schema } from "mongoose";
const MeetingSchema = new Schema({
    title: { type: String, required: true },
    topic: { type: String, required: true },
    type: {
        type: String,
        enum: ["virtual", "physical"],
        required: true,
    },
    venue: { type: String },
    roomNo: { type: String },
    meetingLink: { type: String },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    participants: [{ type: String }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
export default mongoose.model("Meeting", MeetingSchema);

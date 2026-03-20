import mongoose, { Schema } from "mongoose";
const EventSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    endDate: { type: Date },
    location: { type: String, required: true },
    slug: { type: String }, // Link to the dynamic form slug (formId)
    form: { type: Schema.Types.ObjectId, ref: "Form" },
    registeredTeams: [{ type: Schema.Types.ObjectId, ref: "Team" }],
    organizer: { type: Schema.Types.ObjectId, ref: "User" },
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });
export default mongoose.model("Event", EventSchema);

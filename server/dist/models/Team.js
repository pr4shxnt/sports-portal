import mongoose, { Schema } from "mongoose";
export const TeamType = {
    EVENT: "event", // Tournament/competition teams
    GENERAL: "general", // Club organizational structure
    MEMBER: "member", // Initial club registration
};
const TeamSchema = new Schema({
    name: { type: String, required: true },
    sport: { type: String, required: true },
    teamType: {
        type: String,
        enum: Object.values(TeamType),
        required: true,
        default: TeamType.GENERAL,
    },
    event: {
        type: Schema.Types.ObjectId,
        ref: "Event",
    },
    coach: { type: String },
    executive: { type: Schema.Types.ObjectId, ref: "User" },
    members: [
        {
            name: { type: String, required: true },
            email: { type: String, required: true },
            phone: { type: String, required: true },
        },
    ],
    formSubmission: {
        type: Schema.Types.ObjectId,
        ref: "FormSubmission",
    },
}, { timestamps: true });
// Indexes
TeamSchema.index({ teamType: 1 });
TeamSchema.index({ event: 1 });
TeamSchema.index({ sport: 1 });
// Unique constraint: name must be unique within the same event (for event teams)
TeamSchema.index({ name: 1, event: 1 }, {
    unique: true,
    partialFilterExpression: { teamType: TeamType.EVENT },
});
export default mongoose.model("Team", TeamSchema);

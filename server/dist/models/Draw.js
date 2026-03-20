import mongoose, { Schema } from "mongoose";
const DrawSchema = new Schema({
    event: {
        type: Schema.Types.ObjectId,
        ref: "Event",
        required: true,
    },
    format: {
        type: String,
        enum: ["Group", "Knockout"],
        required: true,
    },
    sport: {
        type: String,
        required: true,
    },
    teamSize: {
        type: Number,
    },
    drawnTeams: [
        {
            type: Schema.Types.ObjectId,
            ref: "Team",
        },
    ],
    matchResults: {
        type: Map,
        of: String,
        default: {},
    },
    matchScores: {
        type: Map,
        of: String,
        default: {},
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
}, { timestamps: true });
// Indexes
DrawSchema.index({ event: 1 });
DrawSchema.index({ createdAt: -1 });
export default mongoose.model("Draw", DrawSchema);

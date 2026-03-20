import mongoose, { Schema } from "mongoose";
export var ReportType;
(function (ReportType) {
    ReportType["BUG"] = "bug";
    ReportType["FEEDBACK"] = "feedback";
})(ReportType || (ReportType = {}));
const ReportSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: Object.values(ReportType), required: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    status: {
        type: String,
        enum: ["pending", "reviewed", "resolved"],
        default: "pending",
    },
}, { timestamps: true });
export default mongoose.model("Report", ReportSchema);

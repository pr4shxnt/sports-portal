import mongoose, { Document, Schema } from "mongoose";

export enum ReportType {
  BUG = "bug",
  FEEDBACK = "feedback",
}

export interface IReport extends Document {
  user: Schema.Types.ObjectId;
  type: ReportType;
  subject: string;
  description: string;
  status: "pending" | "reviewed" | "resolved";
}

const ReportSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: Object.values(ReportType), required: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export default mongoose.model<IReport>("Report", ReportSchema);

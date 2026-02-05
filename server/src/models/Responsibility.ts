import mongoose, { Document, Schema } from "mongoose";

export enum RequestStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  RETURNED = "returned",
  OVERDUE = "overdue",
}

export interface IResponsibility extends Document {
  user: Schema.Types.ObjectId;
  equipment: Schema.Types.ObjectId;
  quantity: number;
  requestDate: Date;
  issueDate?: Date;
  returnDate?: Date;
  dueDate?: Date;
  status: RequestStatus;
  notes?: string;
}

const ResponsibilitySchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    equipment: {
      type: Schema.Types.ObjectId,
      ref: "Equipment",
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    requestDate: { type: Date, default: Date.now },
    issueDate: { type: Date }, // When admin approves/gives it
    returnDate: { type: Date }, // Actual return
    dueDate: { type: Date },
    status: {
      type: String,
      enum: Object.values(RequestStatus),
      default: RequestStatus.PENDING,
    },
    notes: { type: String },
  },
  { timestamps: true },
);

export default mongoose.model<IResponsibility>(
  "Responsibility",
  ResponsibilitySchema,
);

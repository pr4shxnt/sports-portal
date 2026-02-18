import mongoose, { Document, Schema } from "mongoose";

export enum RegistrationStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export enum AppliedRole {
  SC_MEMBER = "moderator", // General Member maps to moderator role
  GENERAL_MEMBER = "user", // Student maps to user role
}

export interface IMemberRegistration extends Document {
  name: string;
  email: string;
  phone: string;
  collegeId: string;
  appliedRole: AppliedRole;
  sportsInterests?: string;
  status: RegistrationStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MemberRegistrationSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    collegeId: { type: String, required: true },
    appliedRole: {
      type: String,
      enum: Object.values(AppliedRole),
      required: true,
    },
    sportsInterests: { type: String },
    status: {
      type: String,
      enum: Object.values(RegistrationStatus),
      default: RegistrationStatus.PENDING,
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    note: { type: String },
  },
  { timestamps: true },
);

export default mongoose.model<IMemberRegistration>(
  "MemberRegistration",
  MemberRegistrationSchema,
);

import mongoose, { Document, Schema } from "mongoose";

/** A completed (or later cancelled) player transfer paid in LP (§17.4). */
export interface ITransfer extends Document {
  competition: mongoose.Types.ObjectId;
  window: mongoose.Types.ObjectId;
  player: mongoose.Types.ObjectId;
  fromTeam: mongoose.Types.ObjectId;
  toTeam: mongoose.Types.ObjectId;
  fee: number;
  /** The player's written consent, as recorded by the admin. */
  consentNote?: string;
  status: "completed" | "cancelled";
  cancelReason?: string;
  cancelledAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const TransferSchema = new Schema<ITransfer>(
  {
    competition: {
      type: Schema.Types.ObjectId,
      ref: "Competition",
      required: true,
    },
    window: {
      type: Schema.Types.ObjectId,
      ref: "TransferWindow",
      required: true,
    },
    player: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    fromTeam: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    toTeam: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    fee: { type: Number, required: true, min: 0 },
    consentNote: { type: String, trim: true },
    status: {
      type: String,
      enum: ["completed", "cancelled"],
      default: "completed",
    },
    cancelReason: { type: String, trim: true },
    cancelledAt: Date,
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

TransferSchema.index({ competition: 1, createdAt: -1 });

export default mongoose.model<ITransfer>("Transfer", TransferSchema);

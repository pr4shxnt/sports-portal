import mongoose, { Document, Schema } from "mongoose";

/** An announced transfer window (§17.5): transfers only happen inside one. */
export interface ITransferWindow extends Document {
  competition: mongoose.Types.ObjectId;
  name: string;
  opensAt: Date;
  closesAt: Date;
  createdAt: Date;
}

const TransferWindowSchema = new Schema<ITransferWindow>(
  {
    competition: {
      type: Schema.Types.ObjectId,
      ref: "Competition",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    opensAt: { type: Date, required: true },
    closesAt: { type: Date, required: true },
  },
  { timestamps: true },
);

TransferWindowSchema.index({ competition: 1, opensAt: 1 });

export default mongoose.model<ITransferWindow>(
  "TransferWindow",
  TransferWindowSchema,
);

import mongoose, { Document, Schema } from "mongoose";

/**
 * Sports Club sanctions (§17.6), each published with its reason and length.
 * Transfer cancellations are recorded on the Transfer itself.
 */
export const SANCTION_KINDS = [
  "buy_ban", // team may not buy
  "sell_ban", // team may not sell
  "lp_deduction", // team loses `amount` LP
  "transfer_ineligible", // player can't be bought, sold or moved
  "match_ban", // player misses `matches` more matches (on top of §13)
] as const;
export type SanctionKind = (typeof SANCTION_KINDS)[number];

export interface ISanction extends Document {
  competition: mongoose.Types.ObjectId;
  kind: SanctionKind;
  team?: mongoose.Types.ObjectId | null;
  player?: mongoose.Types.ObjectId | null;
  amount?: number; // lp_deduction
  matches?: number; // match_ban
  /** Bans end at this time; none means the rest of the season. */
  expiresAt?: Date | null;
  reason: string;
  revokedAt?: Date | null;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const SanctionSchema = new Schema<ISanction>(
  {
    competition: {
      type: Schema.Types.ObjectId,
      ref: "Competition",
      required: true,
    },
    kind: { type: String, enum: SANCTION_KINDS, required: true },
    team: { type: Schema.Types.ObjectId, ref: "Team", default: null },
    player: { type: Schema.Types.ObjectId, ref: "Player", default: null },
    amount: { type: Number, min: 1 },
    matches: { type: Number, min: 1 },
    expiresAt: { type: Date, default: null },
    reason: { type: String, required: true, trim: true },
    revokedAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

SanctionSchema.index({ competition: 1, createdAt: -1 });

export default mongoose.model<ISanction>("Sanction", SanctionSchema);

import mongoose, { Document, Schema } from "mongoose";

/**
 * A Champions League season. Teams come from the approved applications of the
 * form at `formSlug`; its draws reuse the tournament engine without an Event,
 * so none of it shows up in the regular events/teams sections.
 */
export const CompetitionStatus = {
  SETUP: "setup", // Teams can be synced and edited
  LIVE: "live", // League started: the team list is locked
} as const;

export type CompetitionStatus =
  (typeof CompetitionStatus)[keyof typeof CompetitionStatus];

export interface ICompetition extends Document {
  name: string;
  season?: string;
  sport: string;
  description?: string;
  formSlug: string;
  status: CompetitionStatus;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CompetitionSchema = new Schema<ICompetition>(
  {
    name: { type: String, required: true, trim: true },
    season: { type: String, trim: true },
    sport: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    formSlug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(CompetitionStatus),
      default: CompetitionStatus.SETUP,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

CompetitionSchema.index({ createdAt: -1 });

export default mongoose.model<ICompetition>("Competition", CompetitionSchema);

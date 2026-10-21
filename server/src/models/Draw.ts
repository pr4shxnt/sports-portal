import mongoose, { Document, Schema } from "mongoose";

export interface IGrouping {
  name: string; // "A", "B", "C" ...
  teams: mongoose.Types.ObjectId[];
}

export const DRAW_FORMATS = ["Group", "Knockout", "League"] as const;
export type DrawFormat = (typeof DRAW_FORMATS)[number];

export interface IDraw extends Document {
  event?: mongoose.Types.ObjectId; // Event draws
  competition?: mongoose.Types.ObjectId; // Champions League draws (no event)
  format: DrawFormat;
  stage?: string; // Display label, e.g. "League Phase", "Round of 16"
  sport: string;
  teamSize?: number;
  scoring?: "football" | "winOnly"; // Missing on legacy draws → "winOnly"
  drawnTeams: mongoose.Types.ObjectId[];
  groupings?: IGrouping[]; // Explicit group assignments (Group / League)
  // Knockout slot layout (null = bye). Missing on legacy draws, which fill
  // slots sequentially from drawnTeams.
  bracketSlots?: (mongoose.Types.ObjectId | null)[];
  parentDraw?: mongoose.Types.ObjectId; // Phase this draw advanced from
  qualifiers?: number; // Rows per table highlighted as qualified
  playIn?: number; // League rows after `qualifiers` sent to a play-in phase
  // Play-in phase: teams that skipped it (seed order) and join the knockout
  // ahead of the play-in qualifiers.
  directQualifiers?: mongoose.Types.ObjectId[];
  matchResults?: Record<string, string>; // matchId -> teamId (winner) | "DRAW"
  matchScores?: Record<string, string>; // matchId -> score (e.g. "2 - 1")
  // Champions League: fair play points per team in this phase (§10.3),
  // kept up to date by the match centre.
  fairPlay?: Record<string, number>;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const GroupingSchema = new Schema(
  {
    name: { type: String, required: true }, // "A", "B", ...
    teams: [{ type: Schema.Types.ObjectId, ref: "Team" }],
  },
  { _id: false },
);

const DrawSchema: Schema = new Schema(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: function (this: IDraw) {
        return !this.competition;
      },
    },
    competition: { type: Schema.Types.ObjectId, ref: "Competition" },
    format: {
      type: String,
      enum: DRAW_FORMATS,
      required: true,
    },
    stage: { type: String },
    sport: {
      type: String,
      required: true,
    },
    teamSize: {
      type: Number,
    },
    scoring: { type: String, enum: ["football", "winOnly"] },
    drawnTeams: [
      {
        type: Schema.Types.ObjectId,
        ref: "Team",
      },
    ],
    groupings: {
      type: [GroupingSchema],
      default: [],
    },
    bracketSlots: {
      type: [{ type: Schema.Types.ObjectId, ref: "Team" }],
      default: undefined,
    },
    parentDraw: { type: Schema.Types.ObjectId, ref: "Draw" },
    qualifiers: { type: Number },
    playIn: { type: Number },
    directQualifiers: {
      type: [{ type: Schema.Types.ObjectId, ref: "Team" }],
      default: undefined,
    },
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
    fairPlay: { type: Map, of: Number, default: undefined },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

// Indexes
DrawSchema.index({ event: 1, createdAt: -1 });
DrawSchema.index({ parentDraw: 1 });
DrawSchema.index({ competition: 1, createdAt: 1 });
DrawSchema.index({ createdAt: -1 });

export default mongoose.model<IDraw>("Draw", DrawSchema);

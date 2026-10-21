import mongoose, { Document, Schema } from "mongoose";

/**
 * A Champions League squad member. Kept apart from Team.members so match
 * events can point at a stable player id and players can later transfer.
 */
export const PLAYER_POSITIONS = ["GK", "FP"] as const; // goalkeeper / field player
export const CAPTAINCY = ["captain", "vice"] as const;

export interface IPlayer extends Document {
  competition: mongoose.Types.ObjectId;
  team: mongoose.Types.ObjectId;
  name: string;
  email?: string;
  phone?: string;
  studentId?: string;
  programme?: string;
  intake?: string;
  shirtNumber?: number;
  position: (typeof PLAYER_POSITIONS)[number];
  captaincy?: (typeof CAPTAINCY)[number] | null;
  photo?: { url: string; publicId: string };
  order: number;
  /** Transfer Value in League Points, set by the Sports Club (§17.3). */
  transferValue?: number | null;
  /** Window the player last moved in: no second move in it (§17.4). */
  movedInWindow?: mongoose.Types.ObjectId | null;
}

const PlayerSchema = new Schema<IPlayer>(
  {
    competition: {
      type: Schema.Types.ObjectId,
      ref: "Competition",
      required: true,
    },
    team: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    studentId: { type: String, trim: true },
    programme: { type: String, trim: true },
    intake: { type: String, trim: true },
    shirtNumber: { type: Number, min: 1, max: 99 },
    position: { type: String, enum: PLAYER_POSITIONS, default: "FP" },
    captaincy: { type: String, enum: [...CAPTAINCY, null], default: null },
    photo: {
      type: new Schema(
        { url: { type: String, required: true }, publicId: String },
        { _id: false },
      ),
      default: undefined,
    },
    order: { type: Number, default: 0 },
    transferValue: { type: Number, min: 0, default: null },
    movedInWindow: {
      type: Schema.Types.ObjectId,
      ref: "TransferWindow",
      default: null,
    },
  },
  { timestamps: true },
);

PlayerSchema.index({ team: 1, order: 1 });
PlayerSchema.index({ competition: 1 });

export default mongoose.model<IPlayer>("Player", PlayerSchema);

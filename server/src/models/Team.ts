import mongoose, { Document, Schema } from "mongoose";

export interface ITeam extends Document {
  name: string;
  sport: string;
  coach?: string;
  executive?: Schema.Types.ObjectId;
  members: Schema.Types.ObjectId[];
}

const TeamSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    sport: { type: String, required: true },
    coach: { type: String },
    executive: { type: Schema.Types.ObjectId, ref: "User" },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

export default mongoose.model<ITeam>("Team", TeamSchema);

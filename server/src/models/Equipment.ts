import mongoose, { Document, Schema } from "mongoose";

export interface IEquipment extends Document {
  name: string;
  category: string;
  quantity: number; // Total available
  condition: string; // New, Good, Fair, Poor
  description?: string;
}

const EquipmentSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    condition: {
      type: String,
      enum: ["New", "Good", "Fair", "Poor"],
      default: "Good",
    },
    description: { type: String },
  },
  { timestamps: true },
);

export default mongoose.model<IEquipment>("Equipment", EquipmentSchema);

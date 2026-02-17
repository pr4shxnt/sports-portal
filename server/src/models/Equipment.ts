import mongoose, { Document, Schema } from "mongoose";

export interface IEquipment extends Document {
  name: string;
  category: string;
  type: "Primary" | "Secondary";
  linkedEquipment?: Schema.Types.ObjectId;
  quantity: number; // Total available
  condition: string; // New, Good, Fair, Poor
  description?: string;
}

const EquipmentSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true }, // General category like "Sports", "Music"
    type: {
      type: String,
      enum: ["Primary", "Secondary"],
      default: "Primary",
    },
    linkedEquipment: {
      type: Schema.Types.ObjectId,
      ref: "Equipment",
    },
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

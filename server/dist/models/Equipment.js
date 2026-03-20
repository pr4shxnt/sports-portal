import mongoose, { Schema } from "mongoose";
const EquipmentSchema = new Schema({
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
}, { timestamps: true });
export default mongoose.model("Equipment", EquipmentSchema);

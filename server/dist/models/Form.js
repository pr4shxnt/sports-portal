import mongoose, { Schema } from "mongoose";
// Field schema (supports nested fields)
const FormFieldSchema = new Schema({
    label: { type: String },
    type: {
        type: String,
        required: true,
        enum: [
            "text",
            "email",
            "number",
            "file",
            "date",
            "select",
            "textarea",
            "members",
        ],
    },
    name: { type: String, required: true },
    placeholder: { type: String },
    required: { type: Boolean, default: false },
    min: { type: Number },
    max: { type: Number },
    options: [{ type: String }],
    pattern: { type: String },
    fields: [{ type: Schema.Types.Mixed }], // Recursive for nested fields
}, { _id: false });
// Form schema
const FormSchema = new Schema({
    formId: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    formTitle: {
        type: String,
        required: true,
        trim: true,
    },
    formDescription: {
        type: String,
        required: true,
    },
    requireSunwayEmail: {
        type: Boolean,
        default: false,
    },
    fields: {
        type: [FormFieldSchema],
        required: true,
        validate: {
            validator: function (fields) {
                return fields.length > 0;
            },
            message: "Form must have at least one field",
        },
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, {
    timestamps: true,
});
// Indexes for performance
FormSchema.index({ formId: 1 });
FormSchema.index({ isActive: 1 });
FormSchema.index({ createdBy: 1 });
const Form = mongoose.model("Form", FormSchema);
export default Form;

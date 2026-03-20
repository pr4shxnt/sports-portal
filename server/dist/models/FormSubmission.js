import mongoose, { Schema } from "mongoose";
export const SubmissionStatus = {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
};
// Form submission schema
const FormSubmissionSchema = new Schema({
    form: {
        type: Schema.Types.ObjectId,
        ref: "Form",
        required: true,
    },
    submittedBy: {
        type: String,
        required: true,
    },
    data: {
        type: Schema.Types.Mixed,
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(SubmissionStatus),
        default: SubmissionStatus.PENDING,
    },
    reviewedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    reviewNotes: {
        type: String,
    },
    submittedAt: {
        type: Date,
        default: Date.now,
    },
    reviewedAt: {
        type: Date,
    },
}, {
    timestamps: true,
});
// Indexes for performance
FormSubmissionSchema.index({ form: 1, submittedAt: -1 });
FormSubmissionSchema.index({ submittedBy: 1 });
FormSubmissionSchema.index({ status: 1 });
const FormSubmission = mongoose.model("FormSubmission", FormSubmissionSchema);
export default FormSubmission;

import mongoose, { Document, Schema } from "mongoose";

export const SubmissionStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export type SubmissionStatus =
  (typeof SubmissionStatus)[keyof typeof SubmissionStatus];

// Form submission document interface
export interface IFormSubmission extends Document {
  form: mongoose.Types.ObjectId;
  submittedBy?: mongoose.Types.ObjectId; // Optional for public forms
  data: Record<string, any>; // Dynamic form data
  status: SubmissionStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewNotes?: string;
  submittedAt: Date;
  reviewedAt?: Date;
}

// Form submission schema
const FormSubmissionSchema = new Schema<IFormSubmission>(
  {
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
  },
  {
    timestamps: true,
  },
);

// Indexes for performance
FormSubmissionSchema.index({ form: 1, submittedAt: -1 });
FormSubmissionSchema.index({ submittedBy: 1 });
FormSubmissionSchema.index({ status: 1 });

const FormSubmission = mongoose.model<IFormSubmission>(
  "FormSubmission",
  FormSubmissionSchema,
);

export default FormSubmission;

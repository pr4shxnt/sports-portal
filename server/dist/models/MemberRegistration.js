import mongoose, { Schema } from "mongoose";
export var RegistrationStatus;
(function (RegistrationStatus) {
    RegistrationStatus["PENDING"] = "pending";
    RegistrationStatus["APPROVED"] = "approved";
    RegistrationStatus["REJECTED"] = "rejected";
})(RegistrationStatus || (RegistrationStatus = {}));
export var AppliedRole;
(function (AppliedRole) {
    AppliedRole["SC_MEMBER"] = "moderator";
    AppliedRole["GENERAL_MEMBER"] = "user";
})(AppliedRole || (AppliedRole = {}));
const MemberRegistrationSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    collegeId: { type: String, required: true },
    appliedRole: {
        type: String,
        enum: Object.values(AppliedRole),
        required: true,
    },
    sportsInterests: { type: String },
    status: {
        type: String,
        enum: Object.values(RegistrationStatus),
        default: RegistrationStatus.PENDING,
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    note: { type: String },
}, { timestamps: true });
export default mongoose.model("MemberRegistration", MemberRegistrationSchema);

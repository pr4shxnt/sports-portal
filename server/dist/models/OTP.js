import mongoose, { Schema } from "mongoose";
const OTPSchema = new Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    otp: {
        type: String,
        required: true,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 }, // TTL index
    },
}, {
    timestamps: true,
});
// Index for email search
OTPSchema.index({ email: 1 });
const OTP = mongoose.model("OTP", OTPSchema);
export default OTP;

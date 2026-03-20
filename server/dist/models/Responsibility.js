import mongoose, { Schema } from "mongoose";
export var RequestStatus;
(function (RequestStatus) {
    RequestStatus["PENDING"] = "pending";
    RequestStatus["APPROVED"] = "approved";
    RequestStatus["REJECTED"] = "rejected";
    RequestStatus["RETURNED"] = "returned";
    RequestStatus["OVERDUE"] = "overdue";
    RequestStatus["WAITING"] = "waiting";
    RequestStatus["TRANSFERRED"] = "transferred";
})(RequestStatus || (RequestStatus = {}));
const ResponsibilitySchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    equipment: {
        type: Schema.Types.ObjectId,
        ref: "Equipment",
        required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    requestDate: { type: Date, default: Date.now },
    issueDate: { type: Date }, // When admin approves/gives it
    returnDate: { type: Date }, // Actual return
    dueDate: { type: Date },
    status: {
        type: String,
        enum: Object.values(RequestStatus),
        default: RequestStatus.PENDING,
    },
    notes: { type: String },
    transferChain: [
        {
            fromUser: { type: Schema.Types.ObjectId, ref: "User" },
            toUser: { type: Schema.Types.ObjectId, ref: "User" },
            date: { type: Date, default: Date.now },
        },
    ],
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
export default mongoose.model("Responsibility", ResponsibilitySchema);

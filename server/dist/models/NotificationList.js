import mongoose, { Schema } from "mongoose";
const NotificationListSchema = new Schema({
    name: { type: String, required: true, unique: true },
    emails: [{ type: String }],
});
export default mongoose.model("NotificationList", NotificationListSchema);

import mongoose, { Document, Schema } from "mongoose";

export interface INotificationList extends Document {
  name: string;
  emails: string[];
}

const NotificationListSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  emails: [{ type: String }],
});

export default mongoose.model<INotificationList>(
  "NotificationList",
  NotificationListSchema,
);

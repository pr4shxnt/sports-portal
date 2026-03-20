import mongoose, { Schema } from "mongoose";
export var UserRole;
(function (UserRole) {
    UserRole["USER"] = "user";
    UserRole["MODERATOR"] = "moderator";
    UserRole["SUPERUSER"] = "superuser";
    UserRole["ADMIN"] = "admin";
})(UserRole || (UserRole = {}));
const UserSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: Object.values(UserRole),
        default: UserRole.USER,
    },
    team: { type: Schema.Types.ObjectId, ref: "Team" },
    isBanned: { type: Boolean, default: false },
    phone: { type: String },
    studentId: { type: String },
    lastProfileUpdate: { type: Date },
    lastPasswordUpdate: { type: Date },
    pushNotificationsEnabled: { type: Boolean, default: true },
}, { timestamps: true });
export default mongoose.model("User", UserSchema);

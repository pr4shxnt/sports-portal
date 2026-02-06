import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

dotenv.config();

const users = [
  {
    name: "Regular Member",
    email: "user@sports.com",
    password: "user123",
    role: "user",
    team: null,
    isBanned: false,
  },
  {
    name: "General Moderator",
    email: "moderator@sports.com",
    password: "mod123",
    role: "moderator",
    team: null,
    isBanned: false,
  },
  {
    name: "College Staff",
    email: "superuser@sports.com",
    password: "super123",
    role: "superuser",
    team: null,
    isBanned: false,
  },
];

const seedUsers = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI || "mongodb://localhost:27017/sports-club";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    for (const userData of users) {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`User ${userData.email} already exists`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = new User({
        ...userData,
        password: hashedPassword,
      });

      await user.save();
      console.log(`Created user: ${userData.name} (${userData.role})`);
    }

    console.log("User seeding completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding users:", error);
    process.exit(1);
  }
};

seedUsers();

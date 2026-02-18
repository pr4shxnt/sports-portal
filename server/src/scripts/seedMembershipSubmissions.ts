import mongoose from "mongoose";
import dotenv from "dotenv";
import MemberRegistration, {
  RegistrationStatus,
  AppliedRole,
} from "../models/MemberRegistration.js";

dotenv.config();

const dummySubmissions = [
  {
    name: "Aman Shah",
    email: "aman@sunway.edu.np",
    phone: "9812345670",
    collegeId: "210345",
    appliedRole: AppliedRole.SC_MEMBER, // Now "General Member"
    sportsInterests: "Futsal, Basketball",
    status: RegistrationStatus.PENDING,
  },
  {
    name: "Binita Rai",
    email: "binita@sunway.edu.np",
    phone: "9845678901",
    collegeId: "220123",
    appliedRole: AppliedRole.SC_MEMBER, // Now "General Member"
    sportsInterests: "Chess, Badminton",
    status: RegistrationStatus.PENDING,
  },
  {
    name: "Chandra Thapa",
    email: "chandra@sunway.edu.np",
    phone: "9801122334",
    collegeId: "210789",
    appliedRole: AppliedRole.GENERAL_MEMBER, // Now "Student"
    sportsInterests: "Futsal",
    status: RegistrationStatus.PENDING,
  },
  {
    name: "Deepa Kushwaha",
    email: "deepa@sunway.edu.np",
    phone: "9860123456",
    collegeId: "230456",
    appliedRole: AppliedRole.GENERAL_MEMBER, // Now "Student"
    sportsInterests: "Table Tennis, Pool",
    status: RegistrationStatus.PENDING,
  },
];

const seedMembershipSubmissions = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI || "mongodb://localhost:27017/sports-club";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    for (const data of dummySubmissions) {
      const existing = await MemberRegistration.findOne({ email: data.email });
      if (existing) {
        console.log(`Application for ${data.email} already exists, skipping.`);
        continue;
      }

      await MemberRegistration.create(data);
      console.log(
        `Created application for: ${data.name} (${data.appliedRole})`,
      );
    }

    console.log("Membership applications seeding completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding membership applications:", error);
    process.exit(1);
  }
};

seedMembershipSubmissions();

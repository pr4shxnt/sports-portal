import mongoose from "mongoose";
import dotenv from "dotenv";
import Form from "../models/Form.js";
import User from "../models/User.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const seedForms = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/sports_club",
    );
    console.log("MongoDB Connected");

    // Find an admin user to assign as creator
    const adminUser = await User.findOne({ role: "admin" });
    if (!adminUser) {
      console.error("No admin user found. Please create an admin user first.");
      process.exit(1);
    }

    // Read form_data.json
    const formDataPath = join(__dirname, "../../../client/data/form_data.json");
    const formData = JSON.parse(readFileSync(formDataPath, "utf-8"));

    // Clear existing forms
    await Form.deleteMany({});
    console.log("Cleared existing forms");

    // Insert forms
    const forms = formData.map((form: any) => ({
      formId: form.id,
      formTitle: form.formTitle,
      formDescription: form.formDescription,
      fields: form.fields,
      isActive: true,
      createdBy: adminUser._id,
    }));

    await Form.insertMany(forms);
    console.log(`✅ Successfully seeded ${forms.length} forms`);

    // Display seeded forms
    forms.forEach((form: any) => {
      console.log(`  - ${form.formTitle} (ID: ${form.formId})`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error seeding forms:", error);
    process.exit(1);
  }
};

seedForms();

import type { Request, Response } from "express";
import OTP from "../models/OTP.js";
import Form from "../models/Form.js";
import nodemailer from "nodemailer";

// Helper to get transporter
const getTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.error(
      "CRITICAL: EMAIL_USER or EMAIL_PASS not found in environment variables",
    );
    throw new Error("Email configuration missing");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: user,
      pass: pass,
    },
  });
};

// Generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOTP = async (req: Request, res: Response) => {
  const { email, formId } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    // Optional: Check if form exists and requires Sunway email
    if (formId) {
      const form = await Form.findOne({ formId });
      if (
        form?.requireSunwayEmail &&
        !email.toLowerCase().endsWith("@sunway.edu.np")
      ) {
        return res.status(400).json({
          message: "Only @sunway.edu.np emails are allowed for this form",
        });
      }
    }

    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Save or update OTP in DB
    await OTP.findOneAndUpdate(
      { email },
      { otp: otpCode, isVerified: false, expiresAt },
      { upsert: true, new: true },
    );

    // Send real email
    const mailOptions = {
      from: `"Sports Club Portal" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP for Registration",
      text: `Your OTP for registration is: ${otpCode}. This code will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #DD1D25;">Verification Code</h2>
          <p>Hello,</p>
          <p>Your OTP for registration is:</p>
          <div style="font-size: 32px; font-weight: bold; color: #333; letter-spacing: 5px; margin: 20px 0;">${otpCode}</div>
          <p>This code will expire in <strong>10 minutes</strong>. If you did not request this code, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #888;">&copy; 2024 Sports Club Portal. All rights reserved.</p>
        </div>
      `,
    };

    await getTransporter().sendMail(mailOptions);
    console.log(`[OTP] Email sent to ${email}`);

    res.status(200).json({
      message: "OTP sent successfully",
      email,
    });
  } catch (error: any) {
    console.error("Error sending OTP:", error);
    res.status(500).json({
      message: "Failed to send OTP. Please check email configuration.",
    });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  try {
    const otpRecord = await OTP.findOne({ email, otp });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    // Mark as verified
    otpRecord.isVerified = true;
    await otpRecord.save();

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error: any) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Failed to verify OTP" });
  }
};

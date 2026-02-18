import { Request, Response } from "express";
import User, { IUser } from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: "30d",
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req: Request, res: Response) => {
  const { name, email, password, role, phone, studentId } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "user", // Default to user if not specified (should be restricted in prod)
      phone,
      studentId,
    });

    if (user) {
      const token = generateToken(
        (user._id as mongoose.Types.ObjectId).toString(),
      );

      // For cross-domain cookies (different Vercel deployments)
      res.cookie("session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        studentId: user.studentId,
        lastProfileUpdate: user.lastProfileUpdate,
        lastPasswordUpdate: user.lastPasswordUpdate,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    console.log(`[Login] Attempt for email: ${email}`);
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`[Login] User not found for email: ${email}`);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password as string);
    console.log(`[Login] Password match for ${email}: ${isMatch}`);

    if (user && isMatch) {
      if (user.isBanned) {
        return res
          .status(403)
          .json({ message: "Your account has been banned." });
      }

      const token = generateToken(
        (user._id as mongoose.Types.ObjectId).toString(),
      );

      // For cross-domain cookies (different Vercel deployments)
      res.cookie("session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        studentId: user.studentId,
        lastProfileUpdate: user.lastProfileUpdate,
        lastPasswordUpdate: user.lastPasswordUpdate,
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const logoutUser = (req: Request, res: Response) => {
  res.cookie("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    expires: new Date(0),
  });
  res.status(200).json({ message: "Logged out" });
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req: Request, res: Response) => {
  if (req.user) {
    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      phone: req.user.phone,
      studentId: req.user.studentId,
      lastProfileUpdate: req.user.lastProfileUpdate,
      lastPasswordUpdate: req.user.lastPasswordUpdate,
    });
  } else {
    res.status(404).json({ message: "User not found" });
  }
};

// @desc    Google Login
// @route   POST /api/auth/google
// @access  Public
export const googleLogin = async (req: Request, res: Response) => {
  const { tokenId, accessToken } = req.body;

  try {
    let email: string | undefined;
    let name: string | undefined;

    if (tokenId) {
      const ticket = await client.verifyIdToken({
        idToken: tokenId,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        return res.status(400).json({ message: "Invalid Google token" });
      }
      email = payload.email;
      name = payload.name;
    } else if (accessToken) {
      // Fetch user info using access token
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`,
      );
      const payload = (await response.json()) as any;

      if (!payload || !payload.email) {
        return res.status(400).json({ message: "Invalid Google access token" });
      }
      email = payload.email;
      name = payload.name;
    } else {
      return res.status(400).json({ message: "No Google token provided" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(403).json({
        message:
          "This email is not registered or approved. Please apply via the registration form first.",
      });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: "Your account has been banned." });
    }

    const token = generateToken(
      (user._id as mongoose.Types.ObjectId).toString(),
    );

    res.cookie("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      studentId: user.studentId,
      lastProfileUpdate: user.lastProfileUpdate,
      lastPasswordUpdate: user.lastPasswordUpdate,
    });
  } catch (error) {
    console.error("Google Login Error:", error);
    res.status(500).json({ message: "Google Authentication failed" });
  }
};

import type { Request, Response } from "express";
import User, { UserRole } from "../models/User.js";
import bcrypt from "bcryptjs";
import { sendUserCredentialsEmail } from "../utils/emailHelper.js";

// @desc    Get all users (with optional role filter)
// @route   GET /api/users
// @access  Private/Admin/Staff/Moderator
export const getUsers = async (req: Request, res: Response) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};

    // Moderators can only view members (users)
    if (req.user?.role === UserRole.MODERATOR) {
      // Force filter to 'user' role only or restrict access?
      // Description says "View members", likely means 'user' role.
      // Let's restricting query to role='user' if moderator
      // Or if no specific filter, return only 'user' users.
      Object.assign(filter, { role: UserRole.USER });
    }

    const users = await User.find(filter).select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Create a new user manually
// @route   POST /api/users
// @access  Private/Admin
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    console.log(req.body);

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
      role: role || UserRole.USER,
    });

    if (user) {
      // Send credentials to user's email
      await sendUserCredentialsEmail(
        email,
        password,
        name,
        role || UserRole.USER,
      );

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin (Moderators can update managed members?)
export const updateUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      // RBAC Logic for update
      // Moderator can update 'user' role? Content says "Update members info".
      // We will allow Moderators to update 'user' role users.
      if (
        req.user?.role === UserRole.MODERATOR &&
        user.role !== UserRole.USER
      ) {
        return res
          .status(403)
          .json({ message: "Moderators can only update members." });
      }

      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      // Only Admin can change roles or ban
      if (req.user?.role === UserRole.ADMIN) {
        user.role = req.body.role || user.role;

        // Ban protection logic
        if (req.body.isBanned !== undefined) {
          // Prevent banning Admin or Superuser
          if (
            user.role === UserRole.ADMIN ||
            user.role === UserRole.SUPERUSER
          ) {
            return res.status(403).json({
              message: `The role "${user.role}" is protected and cannot be banned.`,
            });
          }
          user.isBanned = req.body.isBanned;
        }
      }

      // Moderator may update other info?
      // Assuming straightforward profile update for now.

      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isBanned: updatedUser.isBanned,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      await user.deleteOne();
      res.json({ message: "User removed" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

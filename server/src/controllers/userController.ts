import { Request, Response } from "express";
import User, { UserRole } from "../models/User";

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
        user.isBanned =
          req.body.isBanned !== undefined ? req.body.isBanned : user.isBanned;
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

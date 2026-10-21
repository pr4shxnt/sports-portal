import express, { Request, Response } from "express";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { UserRole } from "../models/User.js";
import { UPLOAD_FOLDERS, UploadKind, signUpload } from "../utils/cloudinary.js";

const router = express.Router();

// @desc    Signature for a direct browser → Cloudinary image upload
// @route   POST /api/uploads/signature   { kind: "player" | "news" }
// @access  Admin
router.post(
  "/signature",
  protect,
  authorize(UserRole.ADMIN),
  (req: Request, res: Response) => {
    const kind = req.body?.kind as UploadKind;
    if (!(kind in UPLOAD_FOLDERS)) {
      return res.status(400).json({ message: "Unknown upload kind" });
    }
    const signed = signUpload(kind);
    if (!signed) {
      return res.status(503).json({
        message:
          "Image uploads aren't configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET on the server.",
      });
    }
    res.json(signed);
  },
);

export default router;

import { Request, Response } from "express";
import Form from "../models/Form.js";
import OTP from "../models/OTP.js";
import FormSubmission, { SubmissionStatus } from "../models/FormSubmission.js";
import Team, { TeamType } from "../models/Team.js";
import { UserRole } from "../models/User.js";

// @desc    Get all active forms
// @route   GET /api/forms
// @access  Public
export const getForms = async (req: Request, res: Response) => {
  try {
    const forms = await Form.find({ isActive: true })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });
    res.json(forms);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Get form by formId
// @route   GET /api/forms/:formId
// @access  Public
export const getFormById = async (req: Request, res: Response) => {
  try {
    const form = await Form.findOne({ formId: req.params.formId }).populate(
      "createdBy",
      "name email",
    );

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    res.json(form);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Create new form
// @route   POST /api/forms
// @access  Private (Admin only)
export const createForm = async (req: Request, res: Response) => {
  try {
    const { formId, formTitle, formDescription, requireSunwayEmail, fields } =
      req.body;

    // Check if form with same formId exists
    const existingForm = await Form.findOne({ formId });
    if (existingForm) {
      return res
        .status(400)
        .json({ message: "Form with this ID already exists" });
    }

    const form = await Form.create({
      formId,
      formTitle,
      formDescription,
      requireSunwayEmail: requireSunwayEmail || false,
      fields,
      createdBy: req.user!._id,
    });

    res.status(201).json(form);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Update form
// @route   PUT /api/forms/:formId
// @access  Private (Admin + Moderator)
export const updateForm = async (req: Request, res: Response) => {
  try {
    const { formTitle, formDescription, requireSunwayEmail, fields, isActive } =
      req.body;

    const form = await Form.findOne({ formId: req.params.formId });

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    // Restriction: Moderators cannot update registration form
    if (
      req.user!.role === UserRole.MODERATOR &&
      req.params.formId === "registration"
    ) {
      return res.status(403).json({
        message:
          "Moderators are not authorized to update the registration form",
      });
    }

    // Update fields
    if (formTitle) form.formTitle = formTitle;
    if (formDescription) form.formDescription = formDescription;
    if (typeof requireSunwayEmail === "boolean")
      form.requireSunwayEmail = requireSunwayEmail;
    if (fields) form.fields = fields;
    if (typeof isActive === "boolean") form.isActive = isActive;

    await form.save();

    res.json(form);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Delete form (soft delete by setting isActive to false)
// @route   DELETE /api/forms/:formId
// @access  Private (Admin only)
export const deleteForm = async (req: Request, res: Response) => {
  try {
    const form = await Form.findOne({ formId: req.params.formId });

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    form.isActive = false;
    await form.save();

    res.json({ message: "Form deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Submit form data
// @route   POST /api/forms/:formId/submit
// @access  Private (Authenticated users)
export const submitForm = async (req: Request, res: Response) => {
  try {
    const form = await Form.findOne({
      formId: req.params.formId,
      isActive: true,
    });

    if (!form) {
      return res.status(404).json({ message: "Form not found or inactive" });
    }

    // Backend Validation for OTP and Sunway Email
    if (form.requireSunwayEmail) {
      const email = req.body.email;
      if (!email || !email.toLowerCase().endsWith("@sunway.edu.np")) {
        return res.status(400).json({
          message: "A valid @sunway.edu.np email is required for this form.",
        });
      }

      // Check if email is verified in OTP collection
      const otpRecord = await OTP.findOne({
        email: email.toLowerCase(),
        isVerified: true,
      });
      if (!otpRecord) {
        return res.status(400).json({
          message:
            "Email verification required. Please verify your email with OTP first.",
        });
      }

      // Optional: Check if OTP is too old (e.g., more than 1 hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (otpRecord.updatedAt < oneHourAgo) {
        return res.status(400).json({
          message: "Email verification has expired. Please verify again.",
        });
      }
    }

    const submission = await FormSubmission.create({
      form: form._id,
      submittedBy: req.body.name || req.body.field_1,
      data: req.body,
      status: SubmissionStatus.PENDING,
    });

    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Get form submissions
// @route   GET /api/forms/:formId/submissions
// @access  Private (Admin + Moderator)
export const getFormSubmissions = async (req: Request, res: Response) => {
  try {
    const form = await Form.findOne({ formId: req.params.formId });

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    // Restriction: Moderators cannot view registration form submissions
    if (
      req.user!.role === UserRole.MODERATOR &&
      req.params.formId === "registration"
    ) {
      return res.status(403).json({
        message:
          "Moderators are not authorized to access registration form submissions",
      });
    }

    const { status } = req.query;
    const filter: any = { form: form._id };

    if (status) {
      filter.status = status;
    }

    const submissions = await FormSubmission.find(filter).sort({
      submittedAt: -1,
    });

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Update submission status and optionally create team
// @route   PATCH /api/forms/submissions/:id/status
// @access  Private (Admin + Moderator)
export const updateSubmissionStatus = async (req: Request, res: Response) => {
  try {
    const { status, reviewNotes, createTeam } = req.body;

    const submission = await FormSubmission.findById(req.params.id).populate(
      "form",
    );

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Restriction: Moderators cannot update registration form submissions
    if (
      req.user!.role === UserRole.MODERATOR &&
      (submission.form as any).formId === "registration"
    ) {
      return res.status(403).json({
        message:
          "Moderators are not authorized to update registration form submissions",
      });
    }

    submission.status = status;
    submission.reviewNotes = reviewNotes;
    submission.reviewedBy = req.user!._id;
    submission.reviewedAt = new Date();

    await submission.save();

    // If approved and createTeam is true, create an event team
    if (status === SubmissionStatus.APPROVED && createTeam) {
      const formData = submission.data;

      // Create team from submission data
      const team = await Team.create({
        name: formData.team_name || formData.full_name || formData.name,
        sport: (submission.form as any).formTitle.includes("Futsal")
          ? "Futsal"
          : (submission.form as any).formTitle.includes("Basketball")
            ? "Basketball"
            : "General",
        teamType:
          (submission.form as any).formId === "registration"
            ? TeamType.MEMBER
            : TeamType.EVENT,
        formSubmission: submission._id,
        members: [], // Members will be added separately
      });

      await submission.populate("reviewedBy", "name email");
      return res.json({ submission, team });
    }

    await submission.populate("reviewedBy", "name email");
    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Get all submissions (for admin dashboard)
// @route   GET /api/forms/submissions
// @access  Private (Admin + Moderator)
export const getAllSubmissions = async (req: Request, res: Response) => {
  try {
    const { status, limit = 50 } = req.query;
    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    // Restriction: If moderator, exclude registration form submissions
    if (req.user!.role === UserRole.MODERATOR) {
      const dbForm = await Form.findOne({ formId: "registration" });
      if (dbForm) {
        filter.form = { $ne: dbForm._id };
      }
    }

    const submissions = await FormSubmission.find(filter)
      .populate("form", "formTitle formId")
      .populate("submittedBy", "name email")
      .populate("reviewedBy", "name email")
      .sort({ submittedAt: -1 })
      .limit(Number(limit));

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

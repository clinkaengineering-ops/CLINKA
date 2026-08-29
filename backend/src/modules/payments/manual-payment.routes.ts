import { Router, Response, NextFunction } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { AuthRequest } from "../../middlewares/auth.middleware";
import ApiResponse from "../../utils/ApiResponse";
import ApiError from "../../utils/ApiError";
import {
  submitManualPayment,
  getManualPaymentSubmissions,
  listAdminManualPayments,
  getAdminManualPaymentDetails,
  adminVerifyManualPayment,
  adminRejectManualPayment,
} from "./manual-payment.service";
import { getStoredUploadPath } from "../../config/upload";
import { submitManualPaymentSchema } from "./payments.validation";
import upload from "../../middlewares/upload.middleware";

const router = Router();

// ─── Client: Submit manual payment proof ────────────────────────────────────

router.post(
  "/projects/:projectId/manual-submit",
  authenticate,
  authorize("CLIENT"),
  upload.single("proof"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const projectId = Number(req.params.projectId);
      const input = submitManualPaymentSchema.parse(req.body);
      
      let proofUrl = input.proofUrl;
      if (req.file) {
        proofUrl = getStoredUploadPath(req.file, "documents");
      }

      const submission = await submitManualPayment(req.user!.userId, projectId, {
        paymentMethod: input.paymentMethod,
        transactionReference: input.transactionReference,
        amount: input.amount,
        currency: input.currency,
        receiptUrl: proofUrl,
        note: input.note,
      });

      res.status(201).json(ApiResponse(201, "Manual payment submitted", submission));
    } catch (error) {
      next(error);
    }
  },
);

// ─── Client: Get my submissions for a project ───────────────────────────────

router.get(
  "/projects/:projectId/manual-submissions",
  authenticate,
  authorize("CLIENT"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const projectId = Number(req.params.projectId);
      const submissions = await getManualPaymentSubmissions(req.user!.userId, projectId);
      res.status(200).json(ApiResponse(200, "Submissions fetched", submissions));
    } catch (error) {
      next(error);
    }
  },
);

// ─── ADMIN: GET PENDING MANUAL PAYMENTS ───────────────────────────────────────
router.get("/admin/manual-payments", authenticate, authorize("ADMIN"), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = (req.query.status as string) || undefined;
    const method = (req.query.method as string) || undefined;
    const search = (req.query.search as string) || undefined;

    const result = await listAdminManualPayments(page, limit, status, method, search);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─── ADMIN: GET SINGLE MANUAL PAYMENT DETAILS ─────────────────────────────────
router.get("/admin/manual-payments/:submissionId", authenticate, authorize("ADMIN"), async (req, res, next) => {
  try {
    const id = parseInt(req.params.submissionId as string, 10);
    const result = await getAdminManualPaymentDetails(id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─── Admin: Verify manual payment ───────────────────────────────────────────

router.post(
  "/admin/manual-payments/:submissionId/verify",
  authenticate,
  authorize("ADMIN"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const submissionId = Number(req.params.submissionId);
      const { adminNote } = req.body;
      const result = await adminVerifyManualPayment(submissionId, req.user!.userId, adminNote);
      res.status(200).json(ApiResponse(200, "Payment verified and escrow funded", result));
    } catch (error) {
      next(error);
    }
  },
);

// ─── Admin: Reject manual payment ───────────────────────────────────────────

router.post(
  "/admin/manual-payments/:submissionId/reject",
  authenticate,
  authorize("ADMIN"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const submissionId = Number(req.params.submissionId);
      const { reason } = req.body;
      const result = await adminRejectManualPayment(submissionId, req.user!.userId, reason);
      res.status(200).json(ApiResponse(200, "Payment rejected", result));
    } catch (error) {
      next(error);
    }
  },
);

export default router;

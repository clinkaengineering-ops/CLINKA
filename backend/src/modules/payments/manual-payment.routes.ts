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
  getManualPaymentSettingsForClient,
} from "./manual-payment.service";
import { getStoredUploadPath } from "../../config/upload";
import { submitManualPaymentSchema } from "./payments.validation";
import { createUploadMiddleware } from "../../config/upload";

// Dedicated upload middleware for payment proofs — 5MB limit, images + PDF
const PROOF_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const proofUpload = createUploadMiddleware("documents", {
  allowedMimeTypes: PROOF_MIME_TYPES,
  maxFileSize: 5 * 1024 * 1024, // 5 MB
  maxFiles: 1,
});

const router = Router();

// ─── Client: Get configured payment destinations ────────────────────────────

router.get(
  "/manual-settings",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const settings = await getManualPaymentSettingsForClient();
      res.status(200).json(ApiResponse(200, "Manual payment settings retrieved", settings));
    } catch (error) {
      next(error);
    }
  },
);

// ─── Client: Submit manual payment proof ────────────────────────────────────

router.post(
  "/projects/:projectId/manual-submit",
  authenticate,
  authorize("CLIENT"),
  proofUpload.single("proof"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const projectId = Number(req.params.projectId);
      const input = submitManualPaymentSchema.parse(req.body);
      
      // Extract proof file metadata
      let proofUrl: string | undefined;
      let proofOriginalName: string | undefined;
      let proofMimeType: string | undefined;
      let proofFileSize: number | undefined;

      if (req.file) {
        proofUrl = getStoredUploadPath(req.file, "documents");
        proofOriginalName = req.file.originalname;
        proofMimeType = req.file.mimetype;
        proofFileSize = req.file.size;
      }

      const submission = await submitManualPayment(req.user!.userId, projectId, {
        paymentMethod: input.paymentMethod,
        transactionReference: input.transactionReference,
        amount: input.amount,
        currency: input.currency,
        note: input.note,

        // Proof
        proofUrl,
        proofOriginalName,
        proofMimeType,
        proofFileSize,

        // Destination snapshot
        receivingMethod: input.receivingMethod,
        receivingCountry: input.receivingCountry,
        receivingAccountName: input.receivingAccountName,
        receivingBankName: input.receivingBankName,
        receivingAccountNumber: input.receivingAccountNumber,
        receivingIban: input.receivingIban,
        receivingSwift: input.receivingSwift,
        receivingCurrency: input.receivingCurrency,
        receivingWalletProvider: input.receivingWalletProvider,
        receivingWalletNumber: input.receivingWalletNumber,
        receivingInstapayAccount: input.receivingInstapayAccount,
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
    const currency = (req.query.currency as string) || undefined;
    const country = (req.query.country as string) || undefined;

    const result = await listAdminManualPayments(page, limit, status, method, search, currency, country);
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

# Manual Payments — Security, Testing, UX & Admin Observability Plan

Scope: temporary manual bank/Instapay/wallet payment flow, replacing Paymob checkout
until gateway paperwork is finished. Covers checkout → escrow → work → balance →
withdrawal → payout.

---

## 1. Threat Model — what can actually go wrong here

Manual payment flows are riskier than gateway flows because the **only proof of
payment is something the client uploads themselves.** That single fact drives most
of the findings below.

| # | Risk | Where it lives today | Why it matters |
|---|------|----------------------|-----------------|
| 1 | Client-supplied `amount` in the manual-submit form is trusted | `ManualPaymentModal.tsx` builds `FormData` with `amount.toString()` from a prop the client's browser holds | A tampered request (devtools/replay) could submit a lower amount than the project budget, or a proof screenshot for a different transaction, if backend doesn't recompute amount from the project record itself |
| 2 | No duplicate/replay protection visible on submission | `submitManualPayment(projectId, formData)` has no idempotency key, unlike `createEngineerWithdrawal` which does support one | A double-click or retried request could create two pending submissions for one payment, or the same proof screenshot could be reused across projects |
| 3 | Proof file is trusted at face value | Client validates type/size only (`ACCEPTED_TYPES`, `MAX_FILE_SIZE`) — purely cosmetic, enforced nowhere server-verifiable from the frontend | A malicious or reused image (e.g. a real transfer screenshot reused for a second, unpaid project) is indistinguishable to the system without manual admin diligence + duplicate-hash detection |
| 4 | Sensitive banking destination details are shown to any authenticated client hitting `/payments/manual-settings` | `fetchManualPaymentSettings()` — no visible scoping beyond "logged in" | If this endpoint isn't scoped to clients with an active `AWAITING_PAYMENT` project, it's an unnecessary information-disclosure surface (full IBAN, SWIFT, wallet numbers) to any signed-in user, including engineers |
| 5 | Admin route protection is 100% client-side | `AdminPage.tsx`: `if (user?.role !== "ADMIN") return <AccessDenied/>` — this is a UI redirect, not an authorization boundary | Anyone can view the React source; if the backend doesn't independently check role on every `/admin/*` and `/payments/*/release`, `/payments/*/refund`, `/admin/verifications/*`, `/admin/bans/*` call, this is a full privilege-escalation path. **This must be verified backend-side — it's the single highest-severity item in this whole plan.** |
| 6 | `AdminChatViewer` gives admin read access to all client↔engineer DMs | Confirmed in `features/admin/components/AdminChatViewer.tsx` + `fetchAdminConversations` | Necessary for dispute resolution, but is a privacy-sensitive surface: needs its own audit trail (who viewed which conversation, when) and should not be casually browsable — access itself should be logged |
| 7 | `IdempotencyKey` pattern exists for withdrawals but not for manual payment submission or admin approve/reject actions | `createEngineerWithdrawal` accepts an `Idempotency-Key` header; `updateVerification`, ban endpoints, `releaseEscrowPayment`, `refundEscrowPayment` do not appear to | Admin double-clicking "Release" or a flaky network retry could double-release/double-refund a payment |
| 8 | Manual-submit transaction reference is free text, no format/uniqueness enforcement visible | `reference` field in `ManualPaymentModal` | Two different clients could submit the same made-up reference; without server-side uniqueness + cross-checking against admin's bank statement import (if any), this is purely advisory, not verifying |
| 9 | LocalStorage persists `{user, sessionReady}` (`authStore.ts`) | Not the session token itself (cookie-based, `withCredentials: true`), but role is client-visible | Low risk on its own since real auth is the httpOnly cookie, but any client-side role check (nav filtering, `AdminPage` guard) is cosmetic only — reinforces #5 |
| 10 | No visible rate limiting on payment-adjacent actions from the frontend | `lib/axios.ts` has no throttling/backoff | Backend must rate-limit `/payments/*/manual-submit`, login, OTP verify, and admin lookup endpoints independently; frontend can add basic debounce/disable-while-submitting (already partially done via `loading` state) |
| 11 | Withdrawal payout methods (`UnifiedWithdrawalPayload`) capture `nationalId`, `iban`, full bank details client-side | `escrow/types.ts` | PII in transit/state — must be masked in any admin list view by default (show last 4 digits), full value visible only on deliberate "reveal" action, itself logged |

---

## 2. Security Hardening Plan

### 2.1 Frontend-enforceable now
- **Never let the client browser be the source of truth for `amount`.** Frontend should keep sending it (useful for immediate UI feedback / mismatch warnings), but the plan assumes backend always recomputes from `project.budget` / `payment.amountUsd` server-side and flags a mismatch rather than trusting the form value.
- **Add an idempotency key** to `submitManualPayment` and to admin `approve/reject`, `releaseEscrowPayment`, `refundEscrowPayment` calls — generate a UUID client-side per submission attempt, disable the submit button while in flight (already done via `loading`), and pass the key through so retries are safe.
- **Disable the submit button and show a persistent "already submitted, pending review" state** after one successful manual submission for a project, instead of allowing the modal to be reopened and a second proof uploaded silently — surface the existing submission status instead.
- **Mask sensitive fields in any UI that lists withdrawal requests** (`accountNumber`, `iban`, `nationalId`) by default; full value behind an explicit "Show" action.
- **Scope `/payments/manual-settings` fetch** to only fire when the signed-in user is the client on that specific `AWAITING_PAYMENT` project (frontend already only calls it from inside checkout, but confirm backend enforces the same scoping — don't rely on "it's only called from this component" as security).

### 2.2 Backend contract requirements (frontend team should confirm/request these — they're outside this repo but gate everything above)
- Every `/admin/*` and financial mutation endpoint independently checks `role === ADMIN` / resource ownership server-side, regardless of what the UI shows.
- `amount` on manual submission is validated against the project's actual price server-side; mismatches are flagged, not silently accepted.
- Manual proof files are stored with content-hash; duplicate-hash detection flags reused screenshots across submissions for admin review.
- Idempotency keys are honored (return the original result on retry, don't reprocess).
- Rate limits on: login, OTP verify, manual-submit, withdrawal-create, admin user lookup.
- All money-moving admin actions require the action to be logged **before** the side effect commits (or in the same transaction) so there's never a state change without a paired log entry.

### 2.3 Access control checklist (must verify, not assume)
- [ ] `/admin/**` API routes reject non-admin roles server-side
- [ ] `/payments/*/release`, `/payments/*/refund` reject non-admin
- [ ] `/admin/bans/*`, `/admin/verifications/*` reject non-admin
- [ ] `/payments/manual-settings` scoped to the requesting client's own pending project, not global
- [ ] `/messages/conversations/:id` — client/engineer can only fetch conversations they're a participant in; admin conversation read access is logged separately from normal access
- [ ] `/payments/engineer/balance` and `/bids/mine` return only the requesting user's own data (IDOR check)

---

## 3. Testing Plan

Playwright is already set up (`tests/*.spec.ts`, `playwright.config.ts`) — extend it
rather than starting fresh.

### 3.1 New Playwright specs
**`tests/manual-payment.spec.ts`**
- Client with an `AWAITING_PAYMENT` project sees manual modal (mock backend returning `checkoutUrl: null`)
- Full happy path: choose method → choose destination → upload valid proof → submit → redirected to project → project shows "Payment under review"
- File validation: reject oversized file, reject wrong mime type, both with visible inline error and no network call fired
- Required-field validation: submit blocked without reference or without file
- Reopening checkout after a pending submission shows "already submitted" state, not a fresh form
- Network failure on submit shows retry-able error, doesn't silently lose the filled form
- Reference field rejects/warns on paste of another project's known reference (if backend uniqueness endpoint exists) — else document as backend TODO

**`tests/admin-payment-review.spec.ts`** (as ADMIN role)
- Pending manual submissions list shows required fields: client, project, amount, method, reference, proof link, submitted-at
- Approve action requires confirmation, is logged, moves project to `IN_PROGRESS`
- Reject action requires a reason, is logged, client sees the rejection + reason and can resubmit
- Non-admin (client/engineer session) hitting `/admin/*` directly via URL gets blocked client-side AND a mocked-403 backend response is handled gracefully (not a blank crash)

**`tests/payout-flow.spec.ts`** (as ENGINEER + ADMIN)
- Engineer requests withdrawal, sees it in `PENDING`/`PENDING_REVIEW` state
- Admin sees payout queue, completes payout (`CompletePayoutModal`) or rejects (`RejectPayoutModal`) with reason
- Engineer balance reflects `heldInWithdrawals` correctly while pending, `availableBalance` decreases only after approval, not on request
- Double-submit protection: rapid double-click on "Request withdrawal" produces one request, not two (idempotency)

**`tests/admin-logs.spec.ts`**
- Every fixture action (approve payment, reject payment, ban user, complete payout, release escrow, refund escrow) produces a corresponding log entry visible in `AdminSystemLogs`
- Filtering by level (`INFO`/`WARN`/`ERROR`) and by category works
- Log entries are read-only in the UI (no edit/delete controls exposed to admin)

### 3.2 Abuse / edge-case matrix
| Scenario | Expected behavior |
|---|---|
| Same proof image uploaded for two different projects | Flagged for manual review (backend hash check); frontend surfaces "under extra review" state rather than auto-approving |
| Client submits amount lower than project price via tampered request | Rejected/flagged server-side; frontend never displays a false "approved" state from a client-controlled value |
| Admin approves, then double-clicks approve again | No double state transition, no duplicate log entry (idempotent) |
| Engineer requests withdrawal for more than `availableBalance` | Blocked client-side with clear message AND rejected server-side |
| Non-admin manually navigates to `/admin/finance/payouts` | Redirected/blocked, no financial data flashes on screen even briefly |
| Session expires mid-checkout | Manual payment form preserves entered data where possible or clearly explains re-login is needed, doesn't silently fail |
| Two admins act on the same pending submission simultaneously | Second admin sees "already resolved by [admin]" instead of being able to double-process |

### 3.3 Regression checklist (run before every deploy while in manual-only mode)
- Manual modal appears whenever `checkoutUrl` is null, for every service type (DESIGN/SUPERVISION/REVIEW)
- Existing Paymob return-flow code (`CheckoutReturnStatus`) still renders correctly for any in-flight legacy Paymob payments — don't break old transactions mid-migration
- i18n: manual payment copy is translated (EN/AR — this app has `LangToggle`/RTL support), not just hardcoded English strings currently in `ManualPaymentModal.tsx`

---

## 4. UX Plan — Temporary Manual-Payment Messaging

### Problems with current copy
- `"You have chosen manual payment."` implies the client picked this over a card option that was never actually offered — confusing and slightly dishonest.
- No explanation anywhere of **why** only manual payment is available, or **how long** review typically takes.
- No visible status/timeline for the client after submitting (just a redirect to the project page).

### Proposed copy & states

**On the checkout page, before the modal even opens** (replace the current `"You have chosen manual payment"` block):
> **Card payments are temporarily unavailable.**
> We're finalizing our payment gateway integration. In the meantime, all payments are processed manually and reviewed by our team — typically within [X hours]. Your funds are held securely and only released to the engineer once you approve the delivered work.
> [View payment instructions]

**Inside the modal, on the final "processing notice" area** (already has a slot: `processingNotice` from admin settings) — make sure admin-configured text always includes expected review time and a support contact/ticket link.

**After submission — project detail page status badge:**
- `Payment submitted — under review` (amber) with submitted timestamp
- On approval → `Payment confirmed — work in progress`
- On rejection → `Payment needs attention` (red) + admin's reason + a clear "Resubmit payment" action, not a dead end

**Notifications** (ties into existing `AppNotification`/`NotificationPrefs` types):
- Client: submission received, approved, rejected (with reason), work delivered, revision requested by them was received
- Engineer: payment confirmed (safe to start), client approved/requested revision, withdrawal approved/completed/rejected
- Admin: new manual submission pending (if not already covered), new withdrawal request pending

**General UX hardening**
- Show a persistent, dismissible banner site-wide (or at least in `/dashboard`, `/checkout`, `/balance`) while manual mode is active, so it's never a surprise mid-flow.
- Make the "Resubmit" path after rejection reuse the same modal pre-filled with method/destination (don't force the client to redo everything).
- Accessibility: modal already uses `role="dialog"` / `aria-modal` — verify focus trap and keyboard escape work (add to `tests/accessibility.spec.ts`, which already exists).

---

## 5. Admin Observability & Audit Log Plan

Goal: **any support inquiry should be answerable by searching one place**, without
asking engineering to query the database.

### 5.1 Event taxonomy (every one of these = one immutable log row)
**Payments**
- `manual_payment.submitted` (client, project, amount, method, reference, proof file id)
- `manual_payment.approved` / `manual_payment.rejected` (admin id, reason if rejected)
- `escrow.released` / `escrow.refunded` (admin id, payment id, amount)
- `payment.amount_mismatch_flagged` (system-detected, if backend supports it)

**Payouts**
- `withdrawal.requested` (engineer id, amount, method)
- `withdrawal.approved` / `withdrawal.rejected` / `withdrawal.completed` / `withdrawal.failed` (admin id, reason/failure detail)

**Projects**
- `project.status_changed` (from → to, actor)
- `project.work_submitted` / `project.revision_requested` / `project.approved`

**Trust & safety**
- `verification.approved` / `verification.rejected` (admin id, engineer id)
- `user.banned` / `user.unbanned` (admin id, reason, expiry)
- `admin.conversation_viewed` (admin id, conversation id) — **this one specifically, since it's a privacy-sensitive read, not just a write**

**Auth**
- `login.success` / `login.failed` (for abuse pattern detection)
- `admin.action_performed` — a catch-all wrapper so nothing admin-side is ever unlogged

### 5.2 Required fields on every log row
`id, timestamp, actor_id, actor_role, action, target_type, target_id, before_state, after_state, ip_address, user_agent, related_ticket_id (nullable)`

### 5.3 Admin UI requirements (extends existing `AdminSystemLogs.tsx`)
- Search/filter by: user (client or engineer), project id, payment id, date range, action type — not just level (INFO/WARN/ERROR) as it is today
- **Per-entity timeline view**: from a user's profile in `AdminUserDirectory`, one click shows every log entry involving them — this is the "someone messages support, we can see their whole story" requirement
- Link support tickets (`AdminSupportTicketsPanel`) to the relevant project/payment so opening a ticket surfaces the related timeline automatically
- Export to CSV for a date range (for manual reconciliation against real bank statements while Paymob is paused)
- Read-only: no admin, including super-admin, can edit or delete a log entry from the UI

### 5.4 Data sensitivity in logs
- Mask full bank account numbers / national IDs in the log list view (same masking rule as §2.1); full reveal is itself a logged action.
- Proof screenshots and chat content are referenced by ID/link, not embedded in the log row itself, to keep the audit log fast and avoid duplicating sensitive files.

---

## 6. Rollout & Rollback

1. Ship logging + idempotency + copy changes first — pure additive, no behavior change, safe to deploy immediately.
2. Confirm backend access-control checklist (§2.3) with backend team before treating admin panel as trustworthy — this is the highest-severity gap and isn't fixable from the frontend alone.
3. Flip manual-only mode via the existing mechanism (`checkoutUrl: null` from `/payments/*/checkout-session`) — no frontend redeploy needed to toggle back to Paymob later, since `CheckoutForm` already branches on that value.
4. When Paymob paperwork clears: re-enable `checkoutUrl` generation server-side, keep the manual path alive as a permanent fallback option (useful for clients whose cards fail, or regions Paymob doesn't cover) rather than ripping it out.
5. Keep the manual-payment banner and audit logging permanently — both are good practice even post-Paymob, not just a temporary shim.

---

## 7. Definition of Done

- [ ] All items in §2.3 access-control checklist confirmed against real backend responses (not just assumed from frontend code)
- [ ] Idempotency key added to manual-submit, withdrawal-create, admin approve/reject/release/refund
- [ ] Copy updated in checkout + modal + project status badges (EN + AR)
- [ ] Notification events wired for every state transition in §4
- [ ] All Playwright specs in §3.1 passing in CI
- [ ] Every action in §5.1 taxonomy confirmed to produce a log row, visible and searchable in `AdminSystemLogs`
- [ ] Per-user timeline view shipped in `AdminUserDirectory`
- [ ] Sensitive-field masking confirmed in admin withdrawal/verification views
- [ ] Rollback to Paymob tested in staging without a frontend deploy

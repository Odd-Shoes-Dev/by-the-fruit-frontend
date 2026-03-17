# Phase: SPV Sprint 4 — In-House E-Signature

## Overview

Sprint 4 adds a lightweight **in-house electronic signature** flow for SPV commitments. After a payment is confirmed (Sprint 3), a `SubscriptionAgreement` is auto-created and the investor is prompted to sign by entering their full legal name. Timestamp, IP, and signer name are stored for an audit trail.

---

## Frontend

### New Page — `pages/sign/[id].js`

Route param `id` = **commitment ID**.

**On load:**
- `GET /profiles/spv-commitments/{id}/` — commitment context (offering, SPV, amount)
- `GET /profiles/subscription-agreements/?commitment_id={id}` — resolves the agreement record

**States:**

| State | Display |
|---|---|
| Agreement not found | Error message (agreement created on payment — refresh if just paid) |
| `status === 'signed'` | Confirmation card with signer name and timestamp |
| `status === 'pending_signature'` | Full sign form |

**Sign form:**
- Scrollable block showing the full agreement text (frozen at payment time)
- Legal name input
- "I have read and agree…" checkbox
- "Sign Agreement" button — disabled until both filled
- Calls `POST /profiles/subscription-agreements/{agreement.id}/sign/` with `{ signer_name }`
- Transitions to signed state in-page on success (no reload)

---

### Updated — `pages/payment/success.js`

After payment, the success page now prompts for signing immediately:
- Primary CTA: **"Sign Agreement Now →"** → `/sign/{commitment_id}`
- Secondary: "Do this later — go to Portfolio"

---

### Updated — `pages/portfolio.js`

Four action states per commitment row:

| Condition | Action |
|---|---|
| `pending` + `kyc_verified` | `Fund →` → `/payment/{id}` |
| `pending` + `!kyc_verified` | `KYC Required` → `/kyc` |
| `funded` + `agreement_status === 'pending_signature'` | `Sign Agreement →` → `/sign/{id}` |
| `funded` + `agreement_status === 'signed'` | `✓ Signed` badge |

`agreement_status` is returned by the API on every `SPVCommitment` object (serializer method field).

---

### New Stylesheet — `styles/Sign.module.css`

Shared by `pages/sign/[id].js`. Key classes:

| Class | Purpose |
|---|---|
| `.agreementBox` | Scrollable container for agreement text (max 320px) |
| `.agreementText` | Georgia serif, pre-wrap, 0.82rem |
| `.signBtn` | Orange submit button |
| `.checkRow` / `.checkbox` | Confirm checkbox with accent-color |
| `.legalNote` | Tiny audit disclaimer beneath submit |
| `.doneCard` | Post-signing green confirmation card |
| `.errorCard` | No-agreement error state |

---

### Updated — `styles/Offerings.module.css`

Two new classes for the portfolio commitment row:
- `.signBtn` — green-tinted bordered link (Sign Agreement action)
- `.signedBadge` — muted green text (✓ Signed)

---

## Complete Investor Journey

```
/offerings  →  commit  →  /kyc  →  /payment/{id}  →  Stripe  →  /payment/success
                                                                       ↓
                                                               /sign/{id}  →  ✓ Signed
```

---

## Backend Summary

See [by-the-fruit/docs/PHASE_SPV_SPRINT4_ESIGNATURE.md](https://github.com/Odd-Shoes-Dev/by-the-fruit/blob/dev/docs/PHASE_SPV_SPRINT4_ESIGNATURE.md) for backend details:
- `SubscriptionAgreement` model + migration 0004
- `SubscriptionAgreementViewSet` with `sign` action
- Auto-creation in Stripe webhook on `checkout.session.completed`
- `agreement_signed` email method
- `agreement_status` field on `SPVCommitmentSerializer`

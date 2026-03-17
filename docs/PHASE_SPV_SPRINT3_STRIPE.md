# Phase: SPV Sprint 3 — Stripe Payments

## Overview

Sprint 3 wires **Stripe Checkout Sessions** into the SPV commitment flow, allowing KYC-verified investors to pay their committed amount through Stripe's hosted payment page.

No custom payment form is built — the backend creates a Checkout Session and returns a redirect URL. After payment Stripe fires a webhook that marks the commitment as `funded` and sends a confirmation email.

---

## Frontend

### New Pages

#### `pages/payment/[id].js`
Payment initiation page.

- Fetches `GET /profiles/spv-commitments/{id}/` to show commitment summary (offering, SPV, amount)
- KYC gate: shows warning + link to `/kyc` if `kyc_verified=false`
- Funded gate: shows "already funded" message if `status==='funded'`
- **Pay button**: calls `POST .../create-checkout-session/` → on success does `window.location.href = checkout_url` (full redirect to Stripe-hosted page)
- Uses `FluffyButton` for the pay CTA

#### `pages/payment/success.js`
Post-payment confirmation page (Stripe redirects here).

- Query params: `commitment_id`, `session_id`
- Fetches updated commitment to display funded amount and offering name
- Shows confirmation message and link to `/portfolio`

#### `pages/payment/cancel.js`
Shown when user abandons the Stripe checkout.

- Query param: `commitment_id`
- "No charge was made" message
- **Try Again** link → back to `payment/[id]`
- **Back to Portfolio** link

---

### Updated — `pages/portfolio.js`

The commitment row now shows action buttons based on state:

| Condition | Button |
|---|---|
| `status==='pending' && kyc_verified===true` | **Fund →** → `/payment/{id}` |
| `status==='pending' && kyc_verified===false` | **KYC Required** → `/kyc` |
| `status==='funded'` | No button (badge only) |

---

### New Stylesheet — `styles/Payment.module.css`

Shared across all three payment pages. Classes:

| Class | Purpose |
|---|---|
| `.wrap` | Centred max-width container |
| `.card` | Main dark card (payment/[id]) |
| `.summaryRow` / `.summaryItem` | 2-col grid showing commitment details |
| `.warningBox` / `.successBox` | Inline alert banners |
| `.secureNote` | "Powered by Stripe" disclaimer |
| `.successCard` / `.checkIcon` | Success page layout |
| `.cancelCard` / `.cancelIcon` | Cancel page layout |
| `.primaryLink` / `.secondaryLink` | CTA link buttons |

---

### Updated — `styles/Offerings.module.css`

Two new classes for the portfolio commitment row:

- `.fundBtn` — orange bordered link button
- `.kycRequiredBtn` — muted bordered link button

---

## Payment Flow

```
Investor (portfolio)
    ↓  clicks "Fund →"
/payment/{id}
    ↓  POST create-checkout-session
Django → Stripe API → returns checkout_url
    ↓  window.location.href = checkout_url
Stripe Hosted Checkout
    ↓  payment succeeds
Stripe → POST /profiles/stripe-webhook/
Django webhook → SPVCommitment.status = 'funded'
              → email: payment_confirmed
    ↓  Stripe redirects browser
/payment/success?commitment_id=...
```

---

## Backend Summary

See [by-the-fruit/docs/PHASE_SPV_SPRINT3_STRIPE.md](https://github.com/Odd-Shoes-Dev/by-the-fruit/blob/dev/docs/PHASE_SPV_SPRINT3_STRIPE.md) for the backend (Django) side of this sprint.

Key backend pieces:
- `stripe==12.1.0` in `requirements.txt`
- `create_checkout_session` action on `SPVCommitmentViewSet`
- `profiles/webhook_views.py` — handles `checkout.session.completed`
- Webhook registered at `POST /profiles/stripe-webhook/`
- `payment_confirmed` email method in `services/emailService.py`

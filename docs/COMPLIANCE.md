# By The Fruit — Compliance & Legal (To Add Later)

This document tracks legal and regulatory items to implement before production. **Do not treat this as legal advice.** Consult qualified counsel for your jurisdiction.

---

## US Investment Regulations

### Accreditation & Investor Limits
- [ ] **Accredited investor verification** — Reg D (506b/506c) requires verification for certain offerings. Add checks for income ($200K+ individual, $300K+ joint) or net worth ($1M+ excluding primary residence).
- [ ] **Regulation Crowdfunding (Reg CF)** — For non-accredited "micro investors": enforce investment limits (e.g. $2,500/year if income & net worth &lt; ~$124K). Integrate income/net worth disclosure flow.
- [ ] **Regulation A** — If offering Tier 1/2 securities, add compliance for limits and disclosure.
- [ ] **KYC/AML** — Identity verification and anti-money-laundering checks where required.
- [ ] **State blue-sky laws** — Consider state-by-state compliance if offerings are state-specific.

### Deal & Offering Compliance
- [ ] **Risk disclosures** — Require investors to acknowledge risks before investing.
- [ ] **Offering documents** — Template or workflow for founders to attach required disclosures.
- [ ] **Disclaimer** — Clear site-wide disclaimer that the platform does not provide legal, tax, or financial advice.

---

## Data & Privacy
- [ ] **Privacy policy** — Full privacy policy and consent flows.
- [ ] **GDPR** (if EU users) — Consent management, data export, right to deletion.
- [ ] **CCPA** (if California users) — Opt-out, data disclosure.

---

## Terms & Disclaimers
- [ ] **Terms of service** — User agreement, liability limits, dispute resolution.
- [ ] **Investor/founder agreements** — Optional templates or links to legal templates for investment terms.

---

## Notes
- **Phase 7**: `InvestmentProfile.is_micro_investor` is in place; Reg CF limits (e.g. $2,500/year for non-accredited) to be enforced in-app when compliance is implemented.
- Micro-investor features should be designed to plug into Reg CF limits when implemented.
- Consider engaging a securities attorney before enabling real money flows.

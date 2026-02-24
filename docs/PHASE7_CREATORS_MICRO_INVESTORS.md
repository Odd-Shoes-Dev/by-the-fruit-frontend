# Phase 7: Creators/Influencers & Micro-Investors

## Overview
Investors can identify as **micro-investors** (smaller check sizes; Reg CF limits to be enforced later) and/or **creators/influencers**. Creator/influencer investors get a dedicated **deals feed** of investment requests (founders seeking funding) ordered by relevance (e.g. category match).

## Backend

### InvestmentProfile (new fields)
- **is_micro_investor** (bool, default False) — Flag for Reg CF / micro-investor flows later.
- **is_creator_influencer** (bool, default False) — Enables “deals for creators” feed.
- **audience_reach** (char, optional) — e.g. `"10K LinkedIn"`, `"50K YouTube"`.

### API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/profiles/investments/` | GET, POST, PATCH, etc. | Includes `is_micro_investor`, `is_creator_influencer`, `audience_reach` |
| `/profiles/investment-requests/deals-for-creators/` | GET | Deals feed for creator/influencer investors (auth required). Returns 403 if user is not a creator/influencer. |

**deals-for-creators response:** List of objects with `id`, `amount`, `description`, `date`, `status`, `business` (id, name, category, description snippet), `founder` (id, full_name), `relevance_score` (higher when business category matches investor’s investment_type). Sorted by relevance then date.

### Migration
- `profiles/migrations/0012_investmentprofile_phase7_creator_micro.py`

## Frontend
- **InvestorProfileForm**: Checkboxes for “Micro-investor” and “Creator/Influencer”; optional “Audience reach” text when creator is checked. Sends new fields to investments API.
- **Deals page** (`/deals`): Fetches `deals-for-creators`. If 403, shows message to enable creator/influencer in profile. Otherwise lists deals with business, founder, amount, description.
- **Nav**: “Deals” link when logged in (index header).

## Compliance note
- **COMPLIANCE.md**: Micro-investor flag is in place; Reg CF limits (e.g. $2,500/year for non-accredited) to be enforced in-app later.

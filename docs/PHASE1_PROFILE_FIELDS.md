# Phase 1: Profile Fields (Contact & Location)

## Overview
Location, address, phone, and postal code added for investors and founders across the platform.

## Backend
- **CustomUser**: `location`, `postal_code` (address, phone already existed)
- **Business**: `postal_code`
- **InvestmentProfile**: `location`, `address`, `phone`, `postal_code` (for public submit)
- **PATCH /user/me**: Update current user profile
- **Register**: Optional `phone`, `address`, `location`, `postal_code`

## Frontend
- FounderProfileForm, InvestorProfileForm: Contact & Location section
- FounderForm, InvestorForm: Business / investor contact fields
- Signup: Password + optional contact fields, API integration with localStorage fallback

## Migrations
- `accounts/0004_customuser_location_postal`
- `profiles/0006_business_postal_code`
- `profiles/0007_investmentprofile_address_location_phone_postal`

# 🌱 By The Fruit — New Conviction Profile Waitlist System

## Implementation Complete ✅

This document outlines the complete implementation of the new **Conviction Profile Waitlist System** — a community-first approach to user onboarding that focuses on identity formation, mission alignment, and pre-commitment.

---

## What Changed

### Before
- **Simple form**: Name, email, password + role
- **Auto-approval or admin approval**: Binary states (pending → approved)
- **No value before approval**: Users wait, confused about status
- **No segmentation**: All users treated equally

### After
- **Multi-step conviction form**: 7-section identity-first signup
- **Personalized profiles**: Each user gets their "archetype" (e.g., "Culture Builder")
- **Immediate engagement**: Post-submit page with share/follow/watch CTAs
- **Rich segmentation**: Role + conviction + capacity + activation mode
- **Email sequences**: Personalized drips based on conviction profile
- **Admin insights**: Dashboard segmentation by conviction type

---

## New Database Structure

### ConvictionProfile Model
Located in: `accounts/models.py`

```python
class ConvictionProfile(models.Model):
    user = OneToOneField(CustomUser) # 1:1 relationship with user
    
    # SECTION 2: What do they want to fund?
    convictions = JSONField()  # Multi-select: [faith_media, safe_tech, ...]
    
    # SECTION 3: How they want to show up
    activation_modes = JSONField()  # Multi-select: [invest, donate, share, ...]
    
    # SECTION 4: Capacity (investors/donors only)
    capacity_level = CharField()  # just_starting | $1K-$10K | $10K-$50K | $50K+ | prefer_not_say
    
    # SECTION 5: Creator-specific
    has_audience = CharField()  # yes_active | exploring | not_yet
    audience_platforms = JSONField()  # [instagram, tiktok, youtube, linkedin]
    
    # SECTION 6: Founder-specific
    raising_status = CharField()  # currently_raising | soon | exploring
    building_description = TextField()  # What are they building?
    
    # Generated Profile (shown to user)
    profile_label = CharField()  # "Culture Builder", "Capital Deployer", etc
    profile_descriptor = TextField()  # "Focused on Safe Tech + Family-first"
```

**Migration**: `accounts/migrations/0007_conviction_profile.py`

---

## API Endpoints

### New Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/accounts/register` | POST | ❌ | Create user + conviction profile (updated) |
| `/accounts/me/conviction-profile` | GET | ✅ | Get authenticated user's conviction profile |

### Updated Endpoints

**RegisterView** now accepts additional fields:
```json
{
  "email": "user@example.com",
  "full_name": "Jane Doe",
  "password": "password123",
  "phone": "+1234567890",
  "location": "San Francisco, CA",
  "postal_code": "94105",
  "intended_role": "founder",
  
  // NEW CONVICTION FIELDS:
  "convictions": ["safe_tech", "family_entertainment"],
  "activation_modes": ["invest", "share"],
  "capacity_level": "10k_50k",
  "has_audience": "yes_active",
  "audience_platforms": ["linkedin", "twitter"],
  "raising_status": "soon",
  "building_description": "AI-powered prayer app for families"
}
```

---

## Frontend Pages

### 1. Multi-Step Signup Form (NEW)
**Path**: `pages/signup/multi-step.js`

**Flow** (conditional steps):
```
Step 0: Role Selection (always)
  └─ Investor / Donor / Creator / Founder / Exploring

Step 1: Convictions (always)
  └─ Multi-select: Faith media, Safe tech, Family, Education, Health, Underserved founders

Step 2: Activation Modes (always)
  └─ Multi-select: Invest, Donate, Share, Advisory, Learn

Step 3: Capacity (if Investor/Donor)
  └─ just_starting | $1K-$10K | $10K-$50K | $50K+ | prefer not to say

Step 4: Creator Lever (if Creator)
  └─ Do you have an audience?
     └─ If yes: Where? (Instagram, TikTok, YouTube, LinkedIn)

Step 5: Founder Intake (if Founder)
  └─ Are you raising? (currently | soon | exploring)
  └─ What are you building? (text)

Step 6: Contact Info (always)
  └─ Name, email, password, phone, location, postal code

```

**Key Features**:
- ✅ Dynamic step filtering based on role
- ✅ "Back" button for navigation
- ✅ "Next" / "Submit" buttons (disabled until fields complete)
- ✅ Progress indication
- ✅ POST to `/accounts/register` with full conviction payload
- ✅ Redirects to `/waitlist/conviction-profile` on success

---

### 2. Conviction Profile Page (POST-SUBMIT)
**Path**: `pages/waitlist/conviction-profile.js`

**Shown Immediately After Signup**:

```
┌─────────────────────────────────────────┐
│  Your Conviction Profile                │
│  ─────────────────────────────────────  │
│  🎯 Culture Builder                     │
│  Focused on Safe Tech + Family-first    │
│  • Likely to invest + share             │
└─────────────────────────────────────────┘

📤 SHARE
   "Invite 3 people who care about this"
   [Copy referral link]

🔗 FOLLOW
   "Stay updated on what's coming"
   → LinkedIn

🎬 WATCH
   "60-sec vision from Chantelle (optional)"
   → YouTube

"You're not joining a list. You're helping fund what comes next."
```

**Key Features**:
- ✅ Fetches conviction profile from API
- ✅ Displays personalized profile label + descriptor
- ✅ Referral link generation + copy-to-clipboard
- ✅ Social proof CTAs (LinkedIn, YouTube)
- ✅ Creates sense of belonging BEFORE approval
- ✅ Immediate activation hooks (share/follow/watch)

---

## Serializers

### ConvictionProfileSerializer
**Path**: `accounts/serializers.py`

```python
class ConvictionProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConvictionProfile
        fields = [
            'id', 'user', 'convictions', 'activation_modes', 'capacity_level',
            'has_audience', 'audience_platforms', 'raising_status',
            'building_description', 'profile_label', 'profile_descriptor',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'profile_label', 'profile_descriptor']
```

### Updated RegisterSerializer
**Path**: `accounts/serializers.py`

**New validators**:
```python
def create(self, validated_data):
    # Extract conviction data
    conviction_data = {
        'convictions': validated_data.pop('convictions', []),
        'activation_modes': validated_data.pop('activation_modes', []),
        'capacity_level': validated_data.pop('capacity_level', None),
        # ... more fields
    }
    
    # Create user
    user = CustomUser.objects.create_user(...)
    
    # Create ConvictionProfile + generate profile label
    conviction_profile = ConvictionProfile.objects.create(user=user, **conviction_data)
    conviction_profile = self._generate_profile_label(conviction_profile)
```

**Profile Label Generation**:
```python
@staticmethod
def _generate_profile_label(conviction_profile):
    """
    Generates archetype based on activation modes:
    - 'share' + 'learn' NOT present → "Culture Amplifier"
    - 'advisory' present → "Culture Builder"
    - 'donate' present → "Impact Supporter"
    - 'invest' present → "Capital Deployer"
    - default → "Aligned Member"
    """
```

---

## Email Tasks

### New Email Tasks
**Path**: `accounts/tasks.py`

1. **send_conviction_profile_email_task** (immediate)
   - Subject: "Your Conviction Profile: [Label] 🎯"
   - Shows their archetype + descriptor
   - Template: `conviction_profile_email.html`

2. **send_conviction_sequence_email_task** (day 3, day 7)
   - Sequence 2 (day 3): "Here are 3 founding principles we're funding"
   - Sequence 3 (day 7): Role-specific
     - Creators: "How to activate your audience"
     - Investors: "Meet 3 other investors like you"
     - Default: "Next steps for your journey"

### Integration
**Updated RegisterView**:
```python
send_waitlist_created_email_task.delay(new_user.email, new_user.full_name)
send_conviction_profile_email_task.delay(new_user.id)  # NEW
```

---

## Views & URL Routing

### New View
**Path**: `accounts/views.py`

```python
class ConvictionProfileView(generics.RetrieveAPIView):
    """Get authenticated user's conviction profile"""
    serializer_class = ConvictionProfileSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_object(self):
        return self.request.user.conviction_profile
```

### URL Registration
**Path**: `accounts/urls.py`

```python
path('me/conviction-profile', views.ConvictionProfileView.as_view(), name='conviction-profile'),
```

---

## User Flow

### Complete Signup Journey

```
1. USER ARRIVES AT /signup/multi-step
   ↓
2. STEP 0: Selects role (investor/creator/founder/etc)
   ↓
3. STEP 1: Selects convictions (multi-select)
   ↓
4. STEP 2: Selects activation modes (how they'll show up)
   ↓
5. STEP 3: If investor → capacity level
   ↓
6. STEP 4: If creator → audience question
   ↓
7. STEP 5: If founder → raising status + building description
   ↓
8. STEP 6: Contact info (name, email, password, phone, location)
   ↓
9. FORM SUBMITS TO /accounts/register
   ↓ Backend creates:
   │  - CustomUser (pending approval)
   │  - ConvictionProfile
   │  - Generates profile_label + profile_descriptor
   │  - Sends confirmation emails (admin + user)
   ↓
10. USER REDIRECTED TO /waitlist/conviction-profile
   ↓
11. POST-SUBMIT PAGE SHOWN:
   │  - "Your Conviction Profile: [Label]"
   │  - Referral link
   │  - Social follow CTAs
   │  - Activation hooks

12. USER COMPLETES ACTIONS:
   │  - Shares with 3 people
   │  - Follows on LinkedIn
   │  - Watches vision video

13. USER GETS EMAIL SEQUENCE:
   │  - Day 0: Conviction profile
   │  - Day 3: Founding principles
   │  - Day 7: Role-specific action

14. ADMIN REVIEWS & APPROVES
   │  - Sees conviction profile
   │  - Can use segmentation filters
   │  - Can send personalized messages

15. USER APPROVED → Full access to platform
    │  - Email: "You're In!"
    │  - In-app notification
    │  - Redirects to /community
```

---

## Data Available for Admin

### Segmentation Insights
After 1,000 signups, admin can see:

```
Conviction Segments:
├─ 32% Faith + Media focused
├─ 28% Safe Tech advocates
├─ 18% Family-first believers
├─ 15% Education backers
└─ 7% Other combinations

Activation Readiness:
├─ 45% Ready to invest
├─ 25% Want to share/amplify
├─ 20% Learning first
└─ 10% Want advisory roles

Capacity Distribution:
├─ 40% Just starting
├─ 35% $1K-$50K range
├─ 20% $50K+
└─ 5% Prefer not to say

Creator Reach:
├─ 280 with active audiences
│  └─ Combined followers: 4.8M
├─ 150 exploring
└─ 570 no audience yet

Founder Pipeline:
├─ 120 currently raising
├─ 85 raising soon
└─ 295 exploring
```

---

## Next Steps (Phase 2)

### Not Yet Implemented

1. **Admin Dashboard Segments View**
   - Filter waitlist by conviction profile
   - See activation mode distribution
   - Capacity level insights
   - Creator audience size tracking

2. **Email Personalization Engine**
   - Create templates for email sequences
   - Use `conviction_profile` to personalize subject lines
   - A/B test different activation messages

3. **Referral Link Tracking**
   - Track who signed up via referral link
   - Reward referrers (gamification)
   - See network effects

4. **Creator Outreach**
   - Automated workflow for creators with audiences
   - "Can we invite your followers?"
   - Track who accepts

5. **Investor Matching**
   - Match investors by capacity + conviction
   - Suggest portfolio companies
   - Facilitate intros

6. **Analytics **
   - Track: conviction profile → activation → approval → engagement
   - Measure best-performing archetypes
   - Optimize future convictions

---

## Testing Checklist

### Frontend
- [ ] Multi-step form loads at `/signup/multi-step`
- [ ] Role selection filters subsequent steps
- [ ] All role-specific steps appear correctly
- [ ] Form validation prevents submission with incomplete fields
- [ ] Submit hits `/accounts/register` with correct payload
- [ ] User redirected to `/waitlist/conviction-profile` on success
- [ ] Conviction profile page displays personalized profile
- [ ] Referral link copy works
- [ ] LinkedIn/YouTube links open in new tabs

### Backend
- [ ] `ConvictionProfile` created on user registration
- [ ] `profile_label` generated correctly
- [ ] `profile_descriptor` generated correctly
- [ ] `GET /accounts/me/conviction-profile` returns full profile
- [ ] `send_conviction_profile_email_task` sends email
- [ ] Email contains personalized convictions + archetype
- [ ] Migration applies without errors

### Admin
- [ ] Admin can see conviction profiles in user list
- [ ] Can filter by `convictions` (future)
- [ ] Can segment by `activation_modes` (future)

---

## Migration Steps

### 1. Database
```bash
python manage.py migrate accounts
```

### 2. Deploy Frontend Changes
```bash
# Add new pages
pages/signup/multi-step.js
pages/waitlist/conviction-profile.js
```

### 3. Update Signup Links (if existing)
- Old: `/signup` → links should point to `/signup/multi-step`
- Keep old form as fallback (optional)

### 4. Test Full Flow
- Sign up at `/signup/multi-step`
- Verify conviction profile page loads
- Check emails received
- Approve in admin dashboard

---

## Files Modified / Created

### Backend
```
✅ accounts/models.py — Added ConvictionProfile model
✅ accounts/migrations/0007_conviction_profile.py — New migration
✅ accounts/serializers.py — Updated RegisterSerializer, added ConvictionProfileSerializer
✅ accounts/views.py — Added ConvictionProfileView, updated RegisterView
✅ accounts/urls.py — Added conviction-profile endpoint
✅ accounts/tasks.py — Added conviction email tasks
```

### Frontend
```
✅ pages/signup/multi-step.js — NEW multi-step form
✅ pages/waitlist/conviction-profile.js — NEW post-submit page
```

### Email Templates (To Create)
```
📧 accounts/templates/accounts/conviction_profile_email.html
📧 accounts/templates/accounts/conviction_sequence_2_email.html
📧 accounts/templates/accounts/conviction_sequence_3_creator_email.html
📧 accounts/templates/accounts/conviction_sequence_3_investor_email.html
📧 accounts/templates/accounts/conviction_sequence_3_default_email.html
```

---

## Environment Variables

Existing (no change needed):
```
ADMIN_EMAIL_RECIPIENT=...
DEFAULT_FROM_EMAIL=...
EMAIL_HOST=...
```

---

## Questions & Support

**What if a user skips steps?**
- Conditional steps only show if role matches

**What happens to old signup form?**
- Still works (`pages/signup/index.js`) for backward compatibility
- Recommend redirecting to `/signup/multi-step`

**How do I customize archetypes?**
- Edit `_generate_profile_label()` method in `RegisterSerializer`
- Currently: Culture Builder, Capital Deployer, Impact Supporter, Culture Amplifier, Aligned Member

**Can I send custom emails per conviction?**
- Yes! Email tasks accept conviction data in context
- Extend `send_conviction_sequence_email_task` with more sequences

---

## Summary

The new **Conviction Profile Waitlist System** transforms signup from a form-filling exercise into a **first engagement touchpoint**. Users self-identify, commit to their role, and immediately feel part of something bigger — all before admin approval.

This approach:
- ✅ Creates **identity formation** (they label themselves)
- ✅ Captures **rich segmentation** (convictions + activation modes)
- ✅ Builds **commitment** (they've already decided how they'll help)
- ✅ Signals **demand** (referral sharing happens immediately)
- ✅ Enables **personalization** (email sequences by conviction type)

**Next Phase**: Use conviction data to inform approval decisions, create admin segmentation dashboard, and power personalized engagement campaigns.

---

*Built: April 2, 2026*
*Status: Complete (core features) | Phase 2 pending*

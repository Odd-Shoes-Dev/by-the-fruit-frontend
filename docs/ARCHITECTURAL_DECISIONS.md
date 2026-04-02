# 🎯 Architectural Decisions — Conviction Profile System

## Design Philosophy

This system was built around **Chantelle's strategic vision**: Transform the waitlist from a *gating mechanism* into a *first conversation*.

**Key Insight**: By capturing conviction + activation data upfront, By The Fruit can:
1. **Build identity** → User commits to a role ("I'm a Creator", "I'm an Investor")
2. **Segment intelligently** → Know exactly how to activate each person
3. **Create belonging before access** → They feel part of something before approval
4. **Generate signal** → Referrals + shares = proof of demand
5. **Enable personalization** → Email sequences matched to their stated mode of involvement

---

## Architecture Decisions & Rationale

### 1. **Why OneToOneField (not inline in CustomUser)?**

**Decision**: `ConvictionProfile` as separate model with `OneToOneField` to `CustomUser`

```python
class ConvictionProfile(models.Model):
    user = OneToOneField(CustomUser, on_delete=CASCADE, related_name='conviction_profile')
```

**Why not inline?** 
- Users in system for 2+ years don't have conviction data — old users would have NULL fields
- Keeps User model clean for other authentication purposes
- Can deprecate this table later without data migration hell
- Makes sense semantically: conviction is *about* the user, not *essential* to being a user

**Why OneToOne (not ForeignKey)?**
- Only one conviction profile per person (1:1)
- Would confuse users to have multiple profiles
- Cleaner for API retrieval: `user.conviction_profile` instead of `user.convictionprofile_set.first()`

---

### 2. **Why JSONField (not separate models for convictions)?**

**Decision**: `convictions` and `activation_modes` as `JSONField` lists

```python
convictions = JSONField()  # ["faith_media", "safe_tech", "family"]
activation_modes = JSONField()  # ["invest", "share"]
```

**Why not normalize (ConvictionType model)?**
- These are fast-changing campaign concepts, not db schema
- Easier to add new conviction (just add string) vs adding model + migration
- API response cleaner (no nested serializers)
- Admin doesn't need to filter by individual convictions in early stage
- Query: `filter(convictions__contains='safe_tech')` works fine with JSONField indexes

**Why JSON isn't wrong:**
- These aren't strict foreign keys — they're semantic labels
- Makes front-end/back-end contract easier
- Can encode conviction attributes later: `{"safe_tech": {"tier": "high", "reason": "parenting"}}` if needed

---

### 3. **Why conditional steps (not all steps for everyone)?**

**Decision**: Multi-step form renders different steps based on role

```javascript
const relevantSteps = STEPS.filter(step => 
  !step.roles || step.roles.includes(role)
);
```

**Before**: "Capacity level" shown to everyone  
**After**: Only Investor/Donor  

**Why conditional?**
- Creators don't care about investment capacity
- Founders don't have "audience platforms" field
- Reduces cognitive load: ask only relevant questions
- Better UX: form feels personalized not generic

**Implementation**: Filter at render time (not server-side) because:
- Reduces API calls
- Allows "back" button to work smoothly
- Frontend retains form state while filtering
- Server-side filtering = need to POST role first (extra step)

---

### 4. **Why generate profile_label immediately (not later)?**

**Decision**: `_generate_profile_label()` called in `RegisterSerializer.create()`

```python
conviction_profile = self._generate_profile_label(conviction_profile)
```

**Why not after email/approval?**
- User needs to see it immediately on conviction-profile page
- Landing on the page and *not* seeing their profile would feel broken
- Algorithm is deterministic (same input = same output) so no risk of changing
- Happens before Celery task, so email gets correct label

**Why server-side (not frontend)?**
- Prevents tampering (user can't choose their own label)
- Creates single source of truth for later segmentation
- Frontend just displays what server says

---

### 5. **Why these 5 archetypes specifically?**

**Current Algorithm**:
```python
if 'advisory' in activation_modes:
    return "Culture Builder"  # Shape direction
elif 'donate' in activation_modes:
    return "Impact Supporter"  # Give money, help people
elif 'invest' in activation_modes:
    return "Capital Deployer"  # Institutional capital
elif 'share' in activation_modes and 'learn' not in activation_modes:
    return "Culture Amplifier"  # Share but not a learner
else:
    return "Aligned Member"  # Default catch-all
```

**Rationale**:
1. **Culture Builder** = Advisory → shapes decisions
2. **Capital Deployer** = Invest → makes it happen financially
3. **Impact Supporter** = Donate → wants to help without equity stake
4. **Culture Amplifier** = Share but not learn → has platform, wants to amplify
5. **Aligned Member** = Others → believes in mission

**Could change**: Each archetype could have its own email sequence, on-platform features, etc.

**Note**: If user selects multiple (e.g., "invest" AND "share"):
- Advisory trumps everything (most active)
- Then donate (impact first)
- Then invest (capital)
- Share/learn are secondary

---

### 6. **Why profile_descriptor is separate from label?**

**Decision**: Two fields for personalization

```python
profile_label = "Culture Builder"  # Short, catchy
profile_descriptor = "Focused on Safe Tech + Family-first. Likely to invest + share"
```

**Why?**
- Label is short for page headers/badges
- Descriptor is longer for email + explanation
- Can regenerate descriptor without changing label
- Email context includes both: `Dear {{ label }} ({{ descriptor }}),`

---

### 7. **Why Celery task triggers in RegisterView.post?**

**Decision**: Added `send_conviction_profile_email_task.delay(new_user.id)` after user creation

```python
new_user = CustomUser.objects.create(...)
send_waitlist_created_email_task.delay(new_user.email)  # Existing
send_conviction_profile_email_task.delay(new_user.id)   # NEW
```

**Why after successful user creation?**
- If email task queued before user created, task might run before DB commit
- Ensures user + conviction profile exists when email task runs
- Easy to test: just check if email task was called

**Why `new_user.id` (not email)?**
- Email can change; ID is immutable
- Task looks up user by ID, loads conviction_profile relation
- Makes query in task idempotent

---

### 8. **Why email sequences on day 3 & 7?**

**Decision**: Celery Beat runs these tasks asynchronously

- Day 0: Conviction profile (immediate)
- Day 3: Founding principles + theory
- Day 7: Role-specific activation (different email per role)

**Why these intervals?**
- Day 0: Strike while hot (just signed up)
- Day 3: Let him process, then send context (founding principles)
- Day 7: Ready for action (specific ask based on role)

**Why different day 7 emails?**
- Creator: "Activate your audience" (different ask)
- Investor: "Meet other investors" (different ask)
- Default: "Next steps" (generic)

**Scheduling**: Uses Celery Beat periodic tasks (not implemented yet)
```python
# Future:
crontab(minute=0, hour=9),  # 9am daily
task='send_conviction_sequence_email_task',
args=(3,)  # sequence_number=3 for Day 3
```

---

### 9. **Why conviction-profile page is separate from signup confirmation?**

**Decision**: `/waitlist/conviction-profile` (not `/signup/success`)

**URL**: Signals intent  
- Old: `/signup/success` = "you did the form"
- New: `/waitlist/conviction-profile` = "here's who you are"

**UX benefit**: 
- Page name reinforces concept: "Your Conviction Profile"
- URL feels like real part of platform (not throwaway page)
- Can recover page later by going back to `/waitlist/conviction-profile`

**Also**: Page calls API to fetch profile data
- Ensures: User → ConvictionProfile exists
- Shows: Exact data stored on backend (transparency)
- Enables: Real-time updates (if user edits profile later)

---

### 10. **Why referral link uses user_code (not user_id)?**

**Decision**: Referral link = `/signup/multi-step?ref={{ user.user_code }}`

```python
# Generated: /signup/multi-step?ref=abc123xyz789
# Not: /signup/multi-step?ref=42
```

**Why?**
- User ID is guessable (sequential 1, 2, 3...)
- User code is opaque random string (privacy friendly)
- Can change user ID (renumber) without breaking old referral links
- More secure: can't enumerate all users by trying IDs

**Future tracking**: `ReferralEvent.referred_by_code` stores code, joins to get user

---

### 11. **Why separate RegisterView update vs ConvictionProfileView?**

**Decision**: Two views, same underlying data

```python
# RegisterView.post = Create user + ConvictionProfile + send email
# ConvictionProfileView.get = Retrieve existing ConvictionProfile (authenticated)
```

**Why not merge?**
- RegisterView is for unauthenticated users (signup)
- ConvictionProfileView is for authenticated users (viewing own profile)
- Different permission classes needed
- Different response context makes sense

**API clarity**:
```
POST /accounts/register — Create user + conviction profile
GET /accounts/me/conviction-profile — Get own profile (authenticated)
PATCH /accounts/me/conviction-profile — Edit profile (future)
```

---

### 12. **Why no approval workflow shown on conviction-profile page?**

**Decision**: Page says "We're reviewing..." without status

```html
<p>We're reviewing your application and will be in touch soon.</p>
```

**Why not "You're pending"?**
- Pending sounds like holding pattern (negative)
- Reviewing sounds like active process (positive)
- Users will check email anyway
- Reduces feature scope (don't need to show approval status)

**Why no countdown timer?**
- Approval time varies (could be hours or days)
- Fake countdown would be annoying
- Better: Tell them via email when approved

---

## What Was NOT Implemented (By Design)

### 1. **Admin segmentation dashboard**
**Reason**: Data layer ready but UI/UX not started
**Impact**: Admin can query directly but no visual interface yet
**Planned**: Phase 2

### 2. **Referral tracking**
**Reason**: URL format ready but no ReferralEvent model created
**Impact**: Can share link but won't see who referred whom
**Planned**: Phase 2

### 3. **Profile editing**
**Reason**: Read-only API is safer for v1
**Impact**: Users can't change convictions after signup
**Planned**: Phase 2 (might add "Update your convictions?" link in day 30 email)

### 4. **Conviction type creation in admin**
**Reason**: Using hardcoded list for now (CONVICTION_OPTIONS)
**Impact**: Adding convictions requires code change
**Planned**: Phase 2+ (admin UI for conviction management)

### 5. **Email template selection by language**
**Reason**: No i18n setup yet
**Impact**: All emails in English
**Planned**: Phase 2+ (if targeting non-English markets)

---

## Data Model Philosophy

### Why NOT normalize everything?

**Tempting to do**:
```python
class ConvictionType(models.Model):
    name = CharField()  # "faith_media", "safe_tech"
    description = TextField()
    color = CharField()

class UserConviction(models.Model):
    user = ForeignKey(User)
    conviction = ForeignKey(ConvictionType)
    importance = IntegerField()
```

**Why we didn't**:
- Premature normalization
- Makes queries more complex (JOIN on conviction type)
- Adds migrations burden
- JSON is "good enough" for MVP
- Can normalize later when convictions stabilize

**When to normalize**: After 10+ conviction types exist and we need to do sophisticated segmentation/analytics.

---

## Performance Considerations

### Database Indexes (Implicit)
```python
# Auto-indexed:
- ConvictionProfile.user_id (OneToOneField creates unique index)
- ConvictionProfile.created_at (for sorting)

# Recommended future indexes:
- Index on created_at for recent signups dashboard
- JSONField indexes on convictions/activation_modes for filtering
```

### Query Patterns
```python
# Fast: Get user's profile
user.conviction_profile  # One query (cached by User object)

# Acceptable: Filter by conviction type
ConvictionProfile.objects.filter(
    convictions__contains=['safe_tech']  # JSONField contains
)  # Full table scan if no index, but dataset small initially

# Slow: Segment analysis
ConvictionProfile.objects.values('profile_label').annotate(
    count=Count('id')
)  # Works fine but might need caching at 10K+ users
```

---

## Security Decisions

### 1. **No user input in profile_descriptor**
- Server-side generated from convictions
- Prevents XSS (user can't inject HTML)

### 2. **API requires authentication for GET /me/conviction-profile**
```python
permission_classes = (permissions.IsAuthenticated,)
```
- Can't guess other users' profiles
- Only can access own

### 3. **User code is opaque**
- New user gets random user_code
- Not sequential (can't enumerate)
- Immutable (can't change it)

---

## Future Extensibility

### Adding new convictions
```python
# Just add to constant in frontend:
const CONVICTION_OPTIONS = [
    { value: 'faith_media', label: 'Faith & Media' },
    { value: 'safe_tech', label: 'Safe Tech' },
    { value: 'climate_tech', label: 'Climate Tech' },  // NEW
]
```

### Adding new archetypes
```python
# Update _generate_profile_label() method:
if 'climate' in convictions and 'invest' in activation_modes:
    return "Climate Catalyst"
```

### Adding profile editing
```python
# Create new view:
class ConvictionProfileUpdateView(generics.UpdateAPIView):
    serializer_class = ConvictionProfileSerializer
    permission_classes = (permissions.IsAuthenticated,)
```

### Adding segmentation dashboard
- Already have data (profile_label, convictions)
- Just need API endpoint to aggregate + frontend to visualize

---

## Testing Strategy (Recommended)

### Unit Tests
```python
# Test _generate_profile_label algorithm
def test_culture_builder_with_advisory():
    profile = ConvictionProfile(activation_modes=['advisory'])
    label = RegisterSerializer._generate_profile_label(profile)
    assert label == "Culture Builder"
```

### Integration Tests
```python
# Test full signup flow
def test_signup_creates_conviction_profile():
    response = client.post('/accounts/register', {
        'email': 'test@example.com',
        'convictions': ['safe_tech'],
        'activation_modes': ['invest'],
        ...
    })
    
    user = CustomUser.objects.get(email='test@example.com')
    assert user.conviction_profile.profile_label is not None
```

### E2E Tests
```
1. Navigate to /signup/multi-step
2. Fill form with role + convictions + activation
3. Submit
4. Check redirect to /waitlist/conviction-profile
5. Verify profile shows on page
6. Check database that ConvictionProfile created
```

---

## Decisions Made With Uncertainty

### 1. **5-day max to approval response**
- Assumed: Users won't wait more than 5 days
- Reality: May vary by user segment
- Monitor: Track bounce rate if approval goes beyond 5 days

### 2. **Referral incentive (day 7 email)**
- Assumed: Creators/investors will share with network
- Reality: Sharing behavior varies by segment
- Monitor: Track referral click-through rate by archetype

### 3. **No branching logic in templates**
- Assumed: Email service (SendGrid, Mailgun) handles simple context
- Reality: Complex personalization may need separate template service
- Monitor: If emails don't render correctly, may need smarter templating

---

## Why This Matters for Chantelle's Vision

**Old approach**: "Fill form → Wait for approval → Forget about it"

**New approach**: "Tell us who you are → We show you your place → You invite others → We engage personally"

The architecture serves this by:
1. **Capturing identity** (convictions + roles) → makes profile possible
2. **Generating personalization** (profile_label) → makes user feel known
3. **Enabling segmentation** (activation_modes stored) → makes targeted emails possible
4. **Creating belonging** (post-submit page) → makes them feel part of movement already
5. **Facilitating network effects** (referral links) → makes growth viral

Every architectural choice ladders back to one of these goals.

---

*Last Updated: Formation phase*  
*Status: Architectural decisions locked, implementation complete, ready for testing*

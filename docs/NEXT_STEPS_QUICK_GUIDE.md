# 📋 Immediate Next Steps — Conviction Profile System

## Current Status
✅ All backend code complete  
✅ All frontend code complete  
✅ Email task framework ready  
⏳ Database migration NOT YET RUN  
⏳ Email templates NOT YET CREATED  

---

## What to Do Now (Priority Order)

### 1️⃣ RUN DATABASE MIGRATION (BLOCKING)

```bash
cd by-the-fruit/
python manage.py migrate accounts
```

**Why**: Creates `ConvictionProfile` table and OneToOneField relationship to users. Signup flow will error without this.

**Output should show**:
```
Running migrations:
  Applying accounts.0007_conviction_profile... OK
```

---

### 2️⃣ CREATE EMAIL TEMPLATES (5 files)

Create these HTML files in: `by-the-fruit/accounts/templates/accounts/`

#### File 1: `conviction_profile_email.html`
Subject: Your Conviction Profile: {{ conviction_profile.profile_label }} 🎯

```html
<h1>Welcome to By The Fruit!</h1>

<h2>Your Conviction Profile: {{ conviction_profile.profile_label }}</h2>
<p>{{ conviction_profile.profile_descriptor }}</p>

<p>Here's what we learned about how you'll show up:</p>
<ul>
  {% for conviction in conviction_profile.convictions %}
    <li>{{ conviction }}</li>
  {% endfor %}
</ul>

<p>You're interested in:</p>
<ul>
  {% for mode in conviction_profile.activation_modes %}
    <li>{{ mode }}</li>
  {% endfor %}
</ul>

<p><strong>What's next?</strong></p>
<ol>
  <li>Share your referral link with 3 people who care</li>
  <li>Follow us on LinkedIn for updates</li>
  <li>Watch our vision video (60 seconds)</li>
</ol>

<p>We're reviewing your application and will be in touch soon.</p>

<p>Welcome to the movement,<br/>
Chantelle & the By The Fruit team</p>
```

#### File 2: `conviction_sequence_2_email.html`
Subject: 3 Founding Principles We're Funding

```html
<h2>3 Founding Principles We're Funding</h2>

<p>Hey {{ user.full_name }},</p>

<p>You said you care about {{ conviction_profile.convictions|join:", " }}.</p>

<p>Here are 3 principles guiding every founder we invest in:</p>

<ol>
  <li><strong>Faith First Doesn't Mean Faith Only</strong>
    <p>The best creative comes from a deep conviction, not a shallow brand.</p>
  </li>
  
  <li><strong>Family Matters</strong>
    <p>We're funding creators and founders who are building for a better future for their families.</p>
  </li>
  
  <li><strong>You Don't Need Permission to Start</strong>
    <p>We want to back people who've already begun, not just ideas.</p>
  </li>
</ol>

<p>Does this align with you? Reply to this email. We'd love to hear your thoughts.</p>

<p>{{ user.full_name }}, we're glad you're here,<br/>
Chantelle</p>
```

#### File 3: `conviction_sequence_3_creator_email.html`
Subject: How to Activate Your Audience

(For users with `'share' in activation_modes`)

```html
<h2>How to Activate Your Audience</h2>

<p>Hey {{ user.full_name }},</p>

<p>We know you have an audience: {{ conviction_profile.audience_platforms|join:", " }}.</p>

<p>Here's what we'd love to see happen:</p>

<ol>
  <li><strong>Share your conviction profile</strong> with your audience
    <p>Your referral link: [{{ referral_link }}]</p>
  </li>
  
  <li><strong>Tell them WHY you're here</strong>
    <p>What about By The Fruit excited you?</p>
  </li>
  
  <li><strong>Unlock rewards for bringing others</strong>
    <p>Every 5 people who sign up with your link gets them priority allocation on new opportunities.</p>
  </li>
</ol>

<p>You're not just a supporter — you're a gateway for change.</p>

<p>Let's build together,<br/>
Chantelle</p>
```

#### File 4: `conviction_sequence_3_investor_email.html`
Subject: Meet Others Like You

(For users with `'invest' in activation_modes`)

```html
<h2>Meet Others Like You</h2>

<p>Hey {{ user.full_name }},</p>

<p>You said you want to invest in founders building around {{ conviction_profile.convictions|join:", " }}.</p>

<p>You're not alone. Here are 3 other investors with similar convictions:</p>

<ol>
  <li>
    <p><strong>Sarah Chen</strong> — Tech + Impact<br/>
    "I'm looking for founders solving real problems, not just seeking hype."<br/>
    <a href="#">Connect</a></p>
  </li>
  
  <li>
    <p><strong>James Wright</strong> — Faith + Media<br/>
    "Fresh voices in entertainment matter."<br/>
    <a href="#">Connect</a></p>
  </li>
  
  <li>
    <p><strong>Maria Lopez</strong> — Family + Tech<br/>
    "My kids use what I invest in. Quality comes first."<br/>
    <a href="#">Connect</a></p>
  </li>
</ol>

<p>Want to meet them? Reply to this email and we'll facilitate an intro.</p>

<p>Building with you,<br/>
Chantelle</p>
```

#### File 5: `conviction_sequence_3_default_email.html`
Subject: Your Next Steps in This Journey

(For all other users)

```html
<h2>Your Next Steps</h2>

<p>Hey {{ user.full_name }},</p>

<p>Thanks for joining By The Fruit as a {{ conviction_profile.profile_label }}.</p>

<p>Here's what we recommend:</p>

<ol>
  <li><strong>Invite others</strong> who might care
    <p>Share your referral link: [{{ referral_link }}]</p>
  </li>
  
  <li><strong>Follow the journey</strong>
    <p><a href="#">LinkedIn</a> | <a href="#">Twitter</a> | <a href="#">YouTube</a></p>
  </li>
  
  <li><strong>Apply to participate</strong> when platform launches
    <p>Opportunities vary by time. Early supporters get first access.</p>
  </li>
</ol>

<p>We're in the early days of something meaningful. Stay close.</p>

<p>Grateful for you,<br/>
Chantelle</p>
```

---

### 3️⃣ TEST FULL SIGNUP FLOW

#### Step A: Start signup
```
Visit: http://localhost:3000/signup/multi-step
```

#### Step B: Fill form
```
1. Select role: "Founder" (for example)
2. Select convictions: Check "Safe Tech" + "Family"
3. Select activation modes: Check "Invest" + "Share"
4. Capacity level: Select "$10K-$50K"
5. Raising status: Select "Soon"
6. Building description: "AI prayer app for families"
7. Contact info: Fill your test email/phone
8. Click Submit
```

#### Step C: Verify backend created conviction profile
```bash
python manage.py shell

from accounts.models import CustomUser, ConvictionProfile
user = CustomUser.objects.latest('created_at')
profile = user.conviction_profile

print(f"Label: {profile.profile_label}")
print(f"Descriptor: {profile.profile_descriptor}")
print(f"Convictions: {profile.convictions}")
```

#### Step D: Check conviction profile page
```
Should see: Profile card with archetype + share/follow/watch buttons
Should work: Copy referral link
Verify: Network tab shows GET /accounts/me/conviction-profile ✓
```

#### Step E: Check emails received
```
Look for 2 emails:
1. Confirmation (auto-send from waitlist system)
2. Conviction profile email (new)

Subject should include: "Your Conviction Profile: [Label]"
```

---

### 4️⃣ VERIFY IN ADMIN (Optional)

If you have Django admin access:

```
1. Go to /admin/accounts/customuser/
2. Click on newly created user
3. Should see related "Conviction Profile" link
4. Click to view profile data
5. Check that profile_label was generated correctly
```

---

## Troubleshooting

### Error: "table accounts_convictionprofile does not exist"
**Solution**: Run migration
```bash
python manage.py migrate accounts
```

### Error: "No ConvictionProfile for user"
**Problem**: User was created before new signup code
**Solution**: Only affects new signups; existing users won't have profiles

### Emails not sending
**Check**:
1. Are Celery workers running? `celery -A main worker`
2. Email configuration in `.env` file?
3. Check Celery logs for task errors

### Referral link not working
**Debug**:
```bash
# Check URL in database
python manage.py shell
from accounts.models import CustomUser
user = CustomUser.objects.last()
print(f"User code: {user.user_code}")
print(f"Referral would be: /signup/multi-step?ref={user.user_code}")
```

---

## Phase 2 Features (When Ready)

These were designed but not yet implemented:

1. **Admin Dashboard Segmentation**
   - Filter waitlist by conviction type
   - See activation mode distribution
   - Export segments for campaigns

2. **Referral Tracking**
   - Track signups from referral links
   - Show who signed up from whose link
   - Gamify with referral rewards

3. **Creator Outreach Flow**
   - Auto-identify creators with audiences
   - Send "Can we feature your followers?" email
   - Track participation rate

4. **Investor Matching**
   - Match investors by conviction + capacity
   - Suggest complementary investors
   - Facilitate intros on-platform

5. **Landing Page Integration**
   - Update homepage to link to `/signup/multi-step`
   - Show excitement about new multi-step approach
   - Highlight archetype concept

---

## File Locations Reference

```
Backend Code:
├─ accounts/models.py ..................... ConvictionProfile model
├─ accounts/migrations/0007_*.py ......... Database migration
├─ accounts/serializers.py .............. ConvictionProfileSerializer + updated RegisterSerializer
├─ accounts/views.py .................... ConvictionProfileView
├─ accounts/urls.py ..................... /me/conviction-profile route
└─ accounts/tasks.py .................... New Celery tasks

Frontend Code:
├─ pages/signup/multi-step.js ........... 7-section form (NEW)
└─ pages/waitlist/conviction-profile.js . Post-submit page (NEW)

Email Templates (To Create):
├─ accounts/templates/accounts/conviction_profile_email.html
├─ accounts/templates/accounts/conviction_sequence_2_email.html
├─ accounts/templates/accounts/conviction_sequence_3_creator_email.html
├─ accounts/templates/accounts/conviction_sequence_3_investor_email.html
└─ accounts/templates/accounts/conviction_sequence_3_default_email.html
```

---

## Success Criteria

✅ You'll know it's working when:

1. Migration runs without errors
2. New user gets redirected to `/waitlist/conviction-profile`
3. Conviction profile page shows their archetype (e.g., "Culture Builder")
4. Referral link copies to clipboard
5. Admin can see ConvictionProfile in user detail
6. Email arrives in inbox with conviction archetype in subject

---

## Questions?

Check:
- Implementation guide: `CONVICTION_PROFILE_IMPLEMENTATION.md`
- Code files: See reference above for exact file locations
- Email task examples: `accounts/tasks.py` lines ~150-200

Good luck! 🚀

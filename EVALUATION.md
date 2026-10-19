# Recruiter evaluation

Scored as a technical recruiter screening for a Senior Data Engineer, 10 points per category.
Round 1 was scored on the first complete build (before the fixes listed under "Improvements");
Round 2 after they were implemented and re-checked in screenshots.

## Round 1

| Category | Score | Notes |
| --- | --- | --- |
| Personal branding | 8 | Clear positioning line (cloud data + security + AI). Consistent teal identity, initials mark, OG image. No photo. |
| First impression | 8 | Name, headline, two-line intro and three CTAs are above the fold on desktop and phone. On a phone the three buttons stacked with different widths, which looked unfinished. |
| Skills presentation | 7 | Every resume term kept, grouped in seven cards. Seventh card sat alone on desktop, and the long AWS list made the row uneven. |
| Experience presentation | 9 | Four roles on a timeline, four bullets visible, rest behind "N more", stack tags per role. Numbers lead the bullets. |
| Project showcase | 9 | Five case studies with Problem, Approach, Implementation, Results, Key learnings and headline metrics. JobHub reads as a real product with honest outcome data. No live demos (private work). |
| Credibility | 7 | Certifications, M.S., JSON-LD and consistent numbers. LinkedIn icon rendered blank (Lucide dropped brand icons), which looked broken next to the email link. No GitHub. |
| Design quality | 8 | Clean type scale, light and dark both legible, contrast checked (teal-700 on white 5.6:1, teal-300 on slate-950 11:1). |
| Mobile experience | 7 | No overflow at 390 px, chips wrap, timeline readable, but the hero CTAs and the timeline gutter wasted space. |
| Recruiter accessibility | 7 | Email, phone, LinkedIn and PDF are one tap away and the mailto has a subject. Missing: availability, a copy-email action. |
| Overall impact | 8 | Specific, measurable, no filler. |
| **Total** | **78** | |

## Improvements (implemented)

1. **Fix the blank LinkedIn icon** by inlining SVG paths for LinkedIn and GitHub in `app.js`, so the
   hero link, the contact card and the "Connect on LinkedIn" button all show the logo. (Credibility,
   recruiter accessibility.)
2. **Full-width, centered CTAs on phones** (`flex-col` under 640 px, `justify-center`), so View
   Projects / Download Resume / Contact Me read as one block. (First impression, mobile.)
3. **Balance the skills grid**: the first and the Security group span two columns on large screens,
   giving a 2+1 / 1+1+1 / 2+1 layout with no orphan card. (Skills.)
4. **Add "Availability: 2 weeks after offer"** to the At-a-glance card, sourced from `profile.json`,
   and keep "remote or hybrid, open to relocation" in the contact card. (Recruiter accessibility.)
5. **Add a Copy email button** in Contact (Clipboard API with a textarea fallback, status announced in
   the button label) and tighten the timeline gutter on phones from 2.5 rem to 1.9 rem so bullets get
   more width. (Recruiter accessibility, mobile.)

## Round 2

| Category | Score | Notes |
| --- | --- | --- |
| Personal branding | 8 | Unchanged; a headshot would add a point but none was supplied. |
| First impression | 9 | Phone hero now reads as one block; desktop unchanged. |
| Skills presentation | 9 | Grid balanced at 1280 px, every term still present. |
| Experience presentation | 9 | Unchanged. |
| Project showcase | 9 | Unchanged. |
| Credibility | 8 | Icons render; LinkedIn is prominent. Still no public code. |
| Design quality | 9 | Balanced grids, consistent spacing, verified in light and dark. |
| Mobile experience | 9 | Verified at a true 390 px viewport: no overflow, CTAs full width, wider bullets. |
| Recruiter accessibility | 9 | Email, copy, call, LinkedIn, PDF, availability and location all within one screen of the Contact heading. |
| Overall impact | 9 | |
| **Total** | **88** | |

## What would move it past 90 (needs Prashanth)

- A professional headshot in the hero (branding, first impression).
- A public GitHub with one sanitized sample (for example the Claude coverage-check Lambda or a dbt
  project) so "Code" buttons appear on at least one project (credibility).
- The final domain in the canonical and Open Graph tags.
- A recorded 2-minute JobHub walkthrough linked as "Demo" on the card.

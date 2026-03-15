# Kazi EA — East Africa Job Platform

A full-stack, production-ready job board for East Africa (Kenya, Uganda, Tanzania, Rwanda, Ethiopia) with AI-powered search, cover letter generation, CV analysis, real-time applications, and email notifications.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS |
| Backend | Next.js API Routes (serverless) |
| Database | Supabase (PostgreSQL + pgvector + RLS) |
| Auth | Supabase Auth (email/password + Google OAuth) |
| File Storage | Supabase Storage (CVs, logos, avatars) |
| AI Features | Anthropic Claude API (cover letters, insights, CV analysis) |
| Email | Resend (application notifications) |
| Payments | Flutterwave (employer subscriptions — optional) |
| Deployment | Vercel |

---

## Features

### Job Seekers
- 🔍 AI-powered job search with East Africa market insights
- 📄 CV upload (PDF/DOCX) with AI analysis and tips
- ✉️ AI-generated streaming cover letters tailored to each role
- 🔖 Save/bookmark jobs
- 📊 Application tracking dashboard
- 📧 Email confirmation on every application

### Employers
- 📝 Post unlimited job listings
- 🌍 Target Kenya, Uganda, Tanzania, Rwanda, or Ethiopia
- 👥 Applicant pipeline (Pending → Reviewing → Shortlisted → Hired)
- 📬 Email notifications on new applications
- 📈 Dashboard with stats

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/your-org/kazi-ea.git
cd kazi-ea
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase/migrations/001_initial_schema.sql`
3. Enable **Google OAuth** under Authentication → Providers (optional)
4. Copy your project URL and anon key

### 3. Configure environment

```bash
cp .env.example .env.local
# Fill in all values in .env.local
```

### 4. Run locally

```bash
npm run dev
# Open http://localhost:3000
```

---

## Deployment (Vercel)

```bash
npm install -g vercel
vercel --prod
```

Add all `.env.local` variables to Vercel's Environment Variables dashboard.

Set your Supabase **Site URL** to your Vercel domain:
`Authentication → URL Configuration → Site URL`

---

## Project Structure

```
kazi-ea/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Homepage with job search
│   │   ├── login/page.tsx            # Auth pages
│   │   ├── register/page.tsx
│   │   ├── dashboard/page.tsx        # Seeker & employer dashboards
│   │   ├── post-job/page.tsx         # Employer job posting
│   │   ├── saved/page.tsx            # Saved jobs
│   │   └── api/
│   │       ├── jobs/route.ts         # Job CRUD + search
│   │       ├── applications/route.ts # Apply + list applications
│   │       ├── saved/route.ts        # Bookmark toggle
│   │       └── ai/
│   │           ├── cover-letter/     # Streaming AI cover letters
│   │           ├── search-insight/   # AI market insights
│   │           └── cv-analysis/      # AI CV tips (reads PDF)
│   ├── components/
│   │   ├── jobs/                     # JobCard, JobGrid, JobSearch, Modals
│   │   ├── seeker/                   # SeekerDashboard
│   │   ├── employer/                 # EmployerDashboard
│   │   ├── shared/                   # CVUpload
│   │   └── ui/                       # Navbar, HeroStats
│   ├── lib/
│   │   ├── supabase/client.ts        # Browser Supabase client
│   │   ├── supabase/server.ts        # Server Supabase client
│   │   └── utils.ts                  # Helpers, constants
│   └── types/index.ts                # TypeScript types
├── supabase/
│   └── migrations/001_initial_schema.sql
├── middleware.ts                     # Auth route protection
├── .env.example
└── README.md
```

---

## AI Features

### Cover Letter (Streaming)
`POST /api/ai/cover-letter` — Fetches job + seeker profile from DB, streams a tailored cover letter via Claude. Supports PDF CV reading.

### Search Insight
`POST /api/ai/search-insight` — Returns a 2-sentence East Africa market insight for any search query.

### CV Analysis
`POST /api/ai/cv-analysis` — Accepts PDF upload, reads it with Claude, returns 3 actionable tips for the East Africa job market.

---

## Database Schema

Key tables:
- `profiles` — extends Supabase auth, stores role (seeker/employer)
- `seeker_profiles` — CV URL, skills, headline, location
- `employer_profiles` — company info, logo, verified status
- `jobs` — listings with full-text search index + pgvector embedding column
- `applications` — job × seeker, status pipeline
- `saved_jobs` — bookmarks per user

Row Level Security is enabled on all tables.

---

## Roadmap

- [ ] pgvector semantic search (embed job descriptions with Claude)
- [ ] Flutterwave payments for featured listings
- [ ] Mobile app (React Native / Expo)
- [ ] Job alerts via email (Resend scheduled emails)
- [ ] Employer verification badges
- [ ] Multi-language support (Swahili, Amharic)
- [ ] SMS notifications (Africa's Talking API)

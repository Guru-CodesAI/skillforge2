# ✨ SkillForge

> An AI-powered, state-of-the-art SaaS platform designed to solve the age-old hackathon problem: **finding the perfect, high-trust teammates dynamically.** 

SkillForge combines a **pure-Python neural network matching engine** with a multi-factor **GitHub Trust Scoring Algorithm** to connect developers based on real-time compatibility, verified skill distribution, and historical commit profiles.

---

## 🚀 Key Features

* **🧠 Neural Matcher**: Computes semantic and mathematical skill overlap, role balancing, and hackathon goal alignment to recommend the best partners.
* **🛡️ Multi-Factor Trust Score**: Generates a 0–10 credibility rating by scoring repository quality, commit consistency, account age, profile completeness, and validation confidence.
* **⚡ Glassmorphic Dashboard**: A stunning, premium user experience featuring subtle interactive micro-animations, glassmorphic card designs, dynamic score rings, and custom HSL gradient themes.
* **🔑 Robust Security & RLS**: Fully protected REST endpoints with FastAPI Security middlewares, rate-limiting, and precise PostgreSQL Row-Level Security (RLS) policies.
* **📈 Self-Healing User Sync**: Lazy client-factory pattern automatically synchronizes Supabase OAuth metadata into your local PostgreSQL instance on first API access.
* **🛠️ Unified Admin Suite**: Full administration panel to manage users, inspect trust scoring weight distribution, audit logs, and monitor security telemetry.

---

## 🛠️ Tech Stack

* **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons, Zustand (State Management).
* **Backend**: FastAPI, Python 3.12, PyJWT, Pydantic, Structlog, PostgREST Python SDK.
* **Database**: Supabase PostgreSQL, Row-Level Security (RLS) tables, and custom PL/pgSQL database triggers.
* **CI/CD**: GitHub Actions (auto-checks, lint checks, type check, and automatic Vercel + Render triggers).

---

## 💻 Local Setup & Development

### 1. Database Setup (Supabase)
1. Create a new project in [Supabase](https://supabase.com).
2. Open the **SQL Editor** in the Supabase console.
3. Paste and run the contents of [`database/schema.sql`](./database/schema.sql) to build all tables, indexes, and automatic timestamp triggers.
4. Paste and run the contents of [`database/policies.sql`](./database/policies.sql) to establish standard database Row Level Security (RLS) access controls.

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install all dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy `.env.template` to `.env` and fill in your Supabase connection strings:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SUPABASE_ANON_KEY=your-anon-key
   JWT_SECRET=your-jwt-signing-secret
   GITHUB_TOKEN=your-optional-github-pat
   ```
5. Launch the backend API server:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install all node modules:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and configure your API coordinates:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_API_URL=http://localhost:8000
   ```
4. Launch the local development dev server:
   ```bash
   npm run dev
   ```

---

## ⚡ Production Deployment

For step-by-step instructions on deploying the frontend to **Vercel** and the backend to **Render** with complete GitHub Actions CI/CD automation, please refer to the [Production Deployment Guide](./deployment_guide.md).

---

## 🛡️ License

Built with 💻 and ☕ for hackathons worldwide. All rights reserved.

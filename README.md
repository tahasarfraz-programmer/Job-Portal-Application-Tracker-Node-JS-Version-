<<<<<<< HEAD
# Hirewell — Node.js + React Implementation

Single-page application: an Express + MongoDB API and a Vite + React client.

## Stack

**Server:** Node.js, Express, MongoDB, Mongoose, JWT, bcrypt, Multer, Helmet, express-rate-limit
**Client:** React 18, Vite, React Router, Tailwind CSS v4, Axios, react-hot-toast

## Setup

You need a MongoDB instance (local `mongod`, Docker, or a free MongoDB Atlas cluster).

### 1. Server

```bash
cd node-react-version/server
npm install
cp .env.example .env       # fill in MONGO_URI and a real JWT_SECRET
npm run seed                # optional: wipes DB and loads fictional demo data
npm run dev                  # starts on http://localhost:5000
```

### 2. Client

```bash
cd node-react-version/client
npm install
cp .env.example .env        # VITE_API_URL, defaults to http://localhost:5000/api
npm run dev                  # starts on http://localhost:5173
```

## Environment variables

**Server `.env`**

| Variable | Purpose |
|---|---|
| `PORT` | API port, default `5000` |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Required. Long random string used to sign auth tokens |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `CLIENT_URL` | Origin allowed by CORS |

**Client `.env`**

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base URL of the API, e.g. `http://localhost:5000/api` |

## Demo accounts (after `npm run seed`)

All demo accounts share the password `Password123!`.

| Role | Email |
|---|---|
| Admin | `admin@demo.test` |
| Candidate | `seeker@demo.test` / `priya@demo.test` |
| Employer | `employer@demo.test` / `mei@demo.test` |

## Server layout

`config/` (DB connection) · `models/` (Mongoose schemas) · `controllers/` (business logic) · `routes/` (Express routers) · `middleware/` (JWT auth, role guards, file upload, error handler) · `services/` (console email backend, notifications) · `seed/` (demo data script)

## API overview

All routes are prefixed with `/api`. Selected endpoints:

```
POST   /api/auth/register            POST /api/auth/login          GET /api/auth/me
PUT    /api/users/profile            POST /api/users/resume        GET /api/users/:id/resume
GET    /api/jobs                     POST /api/jobs (employer)     GET /api/jobs/:id
GET    /api/jobs/:jobId/applicants   POST /api/jobs/:jobId/apply
GET    /api/applications/mine        PATCH /api/applications/:id/status
PUT    /api/saved-jobs/:jobId        GET /api/saved-jobs
POST   /api/interviews/application/:id
GET    /api/employer/stats           GET /api/admin/stats
```

Every response is `{ success: true, data }` or `{ success: false, message }`.

## Testing performed

Manually verified via the running client/server: registration and login (JWT stored in `localStorage`), protected routes with role-based redirects to `/forbidden`, resume upload gating job applications, duplicate-application prevention (unique index + explicit check), employer job CRUD with salary/deadline validation, applicant status transitions and interview scheduling, saved jobs, notifications, and admin user/category management. `npm run build` (Vite) completes without errors.

## Known limitations

- Email sending logs to the server console — swap `services/emailService.js` for a real provider (SES, Postmark, etc.) in production.
- Resumes are stored on local disk (`server/uploads/`); swap for S3-compatible storage in production.
- No automated test suite (Jest/Vitest) is included yet — see the root README's "Future improvements".
=======
# Job-Portal-Application-Tracker-Node-JS-Version-
>>>>>>> 46a5cd3328f17803cf6bd06f4ff52b2c903bc874

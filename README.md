# Mistiri — Backend API

REST API for **Mistiri**, a smart home-maintenance platform. A customer writes a repair problem (AC / electrical / plumbing), gets probable causes + an estimated cost from a rule-based diagnosis engine, finds a matching technician, books the job, tracks its status, and leaves a review.

**Live API:** https://mistiri-backend.vercel.app/api
**Frontend repo:** https://github.com/Biplob106/mistiri-frontend
**Live site:** https://mistiri-frontend.vercel.app

---

## Tech Stack

- **Node.js + Express 5** (TypeScript)
- **MongoDB + Mongoose**
- **JWT** auth (`jsonwebtoken`) + **bcryptjs** password hashing
- **Google Sign-In** verification (`google-auth-library`, ID-token flow)
- **Cloudinary** + Multer for optional image upload
- Deployed on **Vercel**

## Roles

| Role | Can do |
|------|--------|
| **Customer** | submit repair, get diagnosis, book technician, review |
| **Technician** | manage profile & skills, accept jobs, update status |
| **Admin** | verify technicians, manage users, view all bookings & analytics |

---

## Getting Started

```bash
# 1. install
npm install

# 2. create .env (see below)

# 3. run in dev (auto-reload)
npm run dev            # http://localhost:5000

# 4. production build
npm run build          # compiles to dist/
npm start              # runs dist/server.js
```

### Environment variables (`.env`)

```env
PORT=5000
MONGO_URI=<your MongoDB connection string>
JWT_SECRET=<any long random string>

# Google Sign-In (optional) — same Client ID used on the frontend
GOOGLE_CLIENT_ID=<xxxxx.apps.googleusercontent.com>

# Cloudinary (optional) — only needed for repair image uploads
CLOUDINARY_CLOUD_NAME=<...>
CLOUDINARY_API_KEY=<...>
CLOUDINARY_API_SECRET=<...>
```

### Seed data

```bash
npm run seed        # seeds the AI knowledge base (diagnosis rules)
npm run seed:demo   # seeds demo customer, admin, and 6 technicians
```

**Demo credentials** (created by `seed:demo`):

| Role | Email | Password |
|------|-------|----------|
| Customer | `customer@mistiri.app` | `Demo@1234` |
| Admin | `admin@mistiri.app` | `Admin@1234` |

---

## API Reference

Base URL: `/api`. Protected routes need `Authorization: Bearer <token>`.

### Auth — `/auth`
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/register` | public | register (`role` optional: customer/technician) |
| POST | `/login` | public | email + password → JWT |
| POST | `/google` | public | verify Google ID token → JWT |
| GET | `/me` | auth | current user |

### Repairs — `/repairs`
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/` | customer | create request (auto-diagnosis runs); accepts image file or `image` URL |
| GET | `/my` | auth | own requests |
| GET | `/:id` | owner | request details |
| DELETE | `/:id` | owner | delete a request |

### Technicians — `/technicians`
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/` | **public** | list + filter (`?category=&area=`) |
| GET | `/:id` | **public** | technician details |
| POST | `/` | technician | create/update own profile |
| GET | `/me` | technician | own profile |
| GET | `/match/:repairId` | auth | technicians matched to a repair |

### Bookings — `/bookings`
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/` | customer | book a technician for a repair |
| GET | `/my` | customer | own bookings |
| POST | `/:id/review` | customer | leave a review |
| GET | `/assigned` | technician | jobs assigned to me |
| PATCH | `/:id/status` | technician | advance job status |

### Analytics — `/analytics`
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/me` | customer | own summary + charts |
| GET | `/admin` | admin | platform-wide summary |

### Admin — `/admin`
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/users` | admin | list all users |
| DELETE | `/users/:id` | admin | delete a user |
| GET | `/technicians` | admin | list technician profiles |
| PATCH | `/technicians/:id/verify` | admin | verify / unverify a technician |
| GET | `/bookings` | admin | all bookings |

Health check: `GET /api/health`.

---

## Project Structure

```
src/
  config/        # db + cloudinary setup
  controllers/   # auth, repair, technician, booking, analytics, admin
  middleware/    # protect + authorize (role guard)
  models/        # User, Technician, RepairRequest, Booking, AiKnowledge
  routes/        # one router per resource
  services/      # rule-based diagnosis engine
  seed/          # aiKnowledgeSeed, demoSeed
  server.ts      # app entry
```

## Notes

- CORS is open (`app.use(cors())`) so the deployed frontend can call the API.
- Passwords are always hashed; JWTs carry `{ id, role }` and expire in 7 days.
- The diagnosis engine matches keywords from the request against a seeded knowledge base to produce probable causes, a solution, and an estimated cost range.

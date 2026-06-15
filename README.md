# IntellMeet — AI-Powered Enterprise Meeting & Collaboration Platform

> Transform meetings into productive experiences with real-time video, AI summaries, smart action items, and team collaboration.

Built by **Zidio Development**

---

## ✨ Features

### 🎥 Real-Time Video Conferencing
- HD video and audio powered by **WebRTC**
- Screen sharing with one-click toggle
- Live meeting transcription using Web Speech API
- Cloud recording with **Cloudinary** storage

### 🤖 AI-Powered Intelligence
- **Automatic meeting summaries** generated from transcripts
- **Smart action item extraction** with assignee and priority detection
- Export summaries as Markdown files

### 👥 Team Collaboration
- Team workspaces with member management
- **Kanban-style task boards** (To Do → In Progress → Completed)
- Real-time notifications via Socket.io

### 🔐 Enterprise Security
- **JWT authentication** with refresh token rotation (15min access / 7d refresh)
- **OAuth2** sign-in (Google)
- **Role-based access control** (Admin / Member)
- **Redis-backed session caching** with graceful fallback
- Rate limiting and Helmet security headers

### 📊 Analytics Dashboard
- Meeting metrics and trends
- Participant activity tracking
- Task completion rates

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI library |
| TypeScript | 5.x | Type safety |
| Vite | 6.x | Build tool |
| Tailwind CSS | 4.x | Styling |
| shadcn/ui | latest | UI components |
| TanStack Query | 5.x | Server state management |
| Zustand | 5.x | Client state management |
| Socket.io Client | 4.x | Real-time communication |
| Lucide React | latest | Icons |
| Sonner | latest | Toast notifications |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18+ | Runtime |
| Express | 5.x | HTTP framework |
| MongoDB / Mongoose | 8.x | Database |
| Socket.io | 4.x | WebSocket server |
| Redis / ioredis | latest | Session & meeting caching |
| JWT + Refresh Tokens | — | Authentication |
| Passport | latest | OAuth2 (Google) |
| Cloudinary | latest | Media storage (avatars, recordings) |
| Multer | 2.x | File uploads |
| Helmet + Rate Limit | — | Security |

---

## 📋 Prerequisites

- **Node.js** 18+ 
- **MongoDB** (Atlas or local)
- **Redis** (optional — app runs without it with graceful fallback)
- **Cloudinary** account (for media uploads)

---

## 🚀 Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-org/intellmeet.git
cd intellmeet
```

### 2. Server setup

```bash
cd server
npm install
```

Create `.env` file (see `.env.example`):

```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
JWT_SECRET=your_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:5173
REDIS_URL=redis://localhost:6379
SESSION_SECRET=your_session_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

Start the server:

```bash
npm start
```

### 3. Client setup

```bash
cd client
npm install
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📁 Project Structure

```
intellmeet/
├── client/                    # Frontend (React + TypeScript + Vite)
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── AIPanel.tsx    # AI summary & action items panel
│   │   │   ├── ChatBox.tsx    # In-meeting chat
│   │   │   ├── Navbar.tsx     # Top navigation bar
│   │   │   ├── Sidebar.tsx    # Side navigation
│   │   │   ├── VideoRoom.tsx  # WebRTC video room
│   │   │   └── ...
│   │   ├── hooks/             # TanStack Query hooks
│   │   │   ├── useMeetings.ts
│   │   │   ├── useTeams.ts
│   │   │   ├── useTasks.ts
│   │   │   ├── useNotifications.ts
│   │   │   └── useAnalytics.ts
│   │   ├── pages/             # Route pages
│   │   ├── services/          # API client with refresh interceptor
│   │   ├── stores/            # Zustand state stores
│   │   ├── types/             # TypeScript interfaces
│   │   ├── lib/               # Utility functions
│   │   ├── App.tsx            # Root component
│   │   └── main.tsx           # Entry point
│   ├── components.json        # shadcn/ui config
│   ├── tailwind.config.ts     # Tailwind v4 config
│   ├── tsconfig.json          # TypeScript config
│   └── vite.config.ts         # Vite config
│
├── server/                    # Backend (Express + MongoDB)
│   ├── config/
│   │   ├── cloudinary.js      # Cloudinary setup
│   │   ├── multer.js          # Image upload config
│   │   ├── passport.js        # Google OAuth2 strategy
│   │   └── redis.js           # Redis client with fallback
│   ├── controllers/
│   │   ├── authController.js  # Auth + refresh tokens + OAuth
│   │   ├── meetingController.js # Meeting CRUD + recording upload
│   │   └── ...
│   ├── middleware/
│   │   ├── authMiddleware.js  # JWT verification
│   │   ├── roleMiddleware.js  # Admin/Member guards
│   │   ├── cacheMiddleware.js # Redis cache layer
│   │   └── uploadMiddleware.js # Memory multer for recordings
│   ├── models/                # Mongoose schemas
│   ├── routes/                # Express routes
│   └── server.js              # Entry point + Socket.io
│
└── README.md                  # This file
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login (returns access + refresh tokens) |
| POST | `/api/auth/refresh-token` | Rotate refresh token |
| POST | `/api/auth/logout` | Logout (clears refresh token) |
| GET | `/api/auth/profile` | Get profile |
| PUT | `/api/auth/profile` | Update profile (with avatar upload) |
| GET | `/api/auth/google` | Google OAuth initiation |
| GET | `/api/auth/google/callback` | Google OAuth callback |

### Meetings
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/meetings/create` | Create meeting |
| GET | `/api/meetings` | Get all meetings (cached) |
| GET | `/api/meetings/:id` | Get meeting by ID (cached) |
| GET | `/api/meetings/code/:code` | Get meeting by code |
| PUT | `/api/meetings/:id` | Update meeting |
| PUT | `/api/meetings/:id/status` | Update meeting status |
| POST | `/api/meetings/:id/transcript` | Add transcript entry |
| POST | `/api/meetings/:id/recording` | Upload recording to Cloudinary |
| DELETE | `/api/meetings/:id` | Delete meeting (Admin only) |

### Teams, Tasks, Notifications, Analytics
See corresponding route files for full endpoint documentation.

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Secret for access token signing |
| `REFRESH_TOKEN_SECRET` | ✅ | Secret for refresh token signing |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ✅ | Cloudinary API secret |
| `CLIENT_URL` | ⬜ | Frontend URL (default: `http://localhost:5173`) |
| `PORT` | ⬜ | Server port (default: `5000`) |
| `REDIS_URL` | ⬜ | Redis connection URL (graceful fallback) |
| `SESSION_SECRET` | ⬜ | Express session secret |
| `GOOGLE_CLIENT_ID` | ⬜ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ⬜ | Google OAuth client secret |

---

## 🧪 Development

```bash
# TypeScript type check
cd client && npx tsc --noEmit

# Production build
cd client && npm run build

# Server start
cd server && npm start
```

---

## 📄 License

This project is developed as part of the **Zidio Development** internship program.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

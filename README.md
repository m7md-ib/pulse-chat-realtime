# 💬 Pulse Chat — Real-Time Chat Application

A production-grade full-stack real-time chat application built with React + TypeScript, Node.js, Socket.io, and MongoDB.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| State | Zustand + Context API |
| Animations | Framer Motion |
| Backend | Node.js + Express + TypeScript |
| Realtime | Socket.io v4 |
| Database | MongoDB + Mongoose |
| Auth | JWT (JSON Web Tokens) |

---

## ✨ Features

- **Real-time messaging** — instant delivery via Socket.io
- **JWT authentication** — secure register/login, protected socket connections
- **Online presence** — live online/offline status for all users
- **Typing indicators** — "User is typing..." shown in real time
- **Message status** — Sent ✓ → Delivered ✓✓ → Seen ✓✓ (blue)
- **Chat history** — persistent messages in MongoDB, loaded on open
- **Auto-scroll** — always jumps to the latest message
- **Avatar generation** — automatic avatars via DiceBear API
- **Dark theme** — polished dark UI with accent colours and subtle animations
- **Responsive** — works on mobile and desktop

---

## 📦 Project Structure

```
pulse-chat/
├── backend/
│   ├── src/
│   │   ├── config/       # DB connection
│   │   ├── controllers/  # Route handlers
│   │   ├── middleware/    # JWT auth middleware
│   │   ├── models/        # Mongoose schemas (User, Message)
│   │   ├── routes/        # Express routes
│   │   ├── sockets/       # Socket.io event handlers
│   │   └── index.ts       # App entry point
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── auth/      # Login, Register pages
    │   │   ├── chat/      # ChatLayout, Sidebar, ChatWindow, etc.
    │   │   └── ui/        # ProtectedRoute
    │   ├── context/       # AuthContext (React Context)
    │   ├── hooks/         # useSocket
    │   ├── services/      # Axios API + Socket.io client
    │   ├── store/         # Zustand chat store
    │   ├── styles/        # Global CSS
    │   ├── types/         # TypeScript interfaces
    │   ├── utils/         # Date/time formatters
    │   └── App.tsx
    ├── .env.example
    ├── index.html
    ├── package.json
    └── vite.config.ts
```

---

## 🛠️ Setup & Installation

### Prerequisites

- **Node.js** v18+ ([nodejs.org](https://nodejs.org))
- **MongoDB** — either:
  - Local: install from [mongodb.com](https://www.mongodb.com/try/download/community)
  - Cloud: create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)

---

### 1. Clone / Extract the project

```bash
cd pulse-chat
```

### 2. Set up Backend environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chatapp   # or your Atlas URI
JWT_SECRET=change_this_to_a_long_random_string
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 3. Set up Frontend environment

```bash
cd ../frontend
cp .env.example .env
```

Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### 4. Install dependencies

```bash
# From the root pulse-chat/ directory:
cd backend && npm install
cd ../frontend && npm install
```

### 5. Start the application

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Server starts on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# App opens at http://localhost:5173
```

Open two different browser windows (or use incognito) and register two accounts to test real-time messaging.

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login & get JWT |
| GET | `/api/auth/me` | Get current user (🔒) |

### Users
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | List all other users (🔒) |

### Messages
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/messages/:userId` | Get chat history with user (🔒) |

🔒 = requires `Authorization: Bearer <token>` header

---

## ⚡ Socket Events

### Client → Server
| Event | Payload | Description |
|---|---|---|
| `send_message` | `{ receiverId, content }` | Send a message |
| `typing` | `{ receiverId, isTyping }` | Broadcast typing state |
| `mark_seen` | `{ senderId }` | Mark messages as seen |

### Server → Client
| Event | Payload | Description |
|---|---|---|
| `receive_message` | `Message` | New message received |
| `online_users` | `string[]` | Updated list of online user IDs |
| `user_typing` | `{ userId, username, isTyping }` | Typing status |
| `messages_seen` | `{ by: userId }` | Messages were seen |

---

## 🔐 Security

- Passwords are hashed with **bcrypt** (12 salt rounds)
- JWTs expire after **7 days**
- Socket connections are authenticated via JWT in the handshake `auth` field
- Unauthenticated socket connections are rejected immediately
- Messages are only emitted to the intended recipient's room

---

## 🏗️ Extending the App

### Add Group Chat
1. Create a `Room` model with `members[]` and `isGroup: boolean`
2. Add a `roomId` field to `Message`
3. Socket: use `socket.join(roomId)` and emit to `roomId`

### Add File Sending
1. Add `multer` to backend for file uploads
2. Store file URL in `Message.content` or a new `attachment` field
3. Frontend: render image/file previews in MessageBubble

### Add Push Notifications
1. Integrate Web Push API or a service like Firebase Cloud Messaging
2. Trigger on `receive_message` when tab is not focused

---

## 📝 Environment Variables

### Backend `.env`
| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Server port |
| `MONGODB_URI` | `mongodb://localhost:27017/chatapp` | MongoDB connection string |
| `JWT_SECRET` | — | **Required** — secret for signing JWTs |
| `CLIENT_URL` | `http://localhost:5173` | Frontend URL for CORS |
| `NODE_ENV` | `development` | Environment |

### Frontend `.env`
| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5000` | Backend API base URL |
| `VITE_SOCKET_URL` | `http://localhost:5000` | Socket.io server URL |

---

## 🐛 Troubleshooting

**"MongoServerError: connect ECONNREFUSED"**  
→ Make sure MongoDB is running: `mongod` or start your Atlas cluster.

**Socket connection errors**  
→ Verify `VITE_SOCKET_URL` matches your backend port. Check CORS config in `backend/.env` matches frontend URL.

**Messages not appearing**  
→ Open browser devtools, check Console for errors. Verify both users are logged in and the socket connects (`🔌 Socket connected` in console).

**Port already in use**  
→ Change `PORT` in `backend/.env` and update `VITE_API_URL`/`VITE_SOCKET_URL` in `frontend/.env`.

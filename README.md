# HeartLink Chat

HeartLink Chat is a full-stack real-time chat application built with the MERN stack and Socket.io. It includes JWT authentication, MongoDB-backed chat history, online presence, typing indicators, seen status updates, emoji support, and a responsive chat interface that works on desktop and mobile.

## Tech Stack

- MongoDB + Mongoose
- Express + Node.js
- React + Vite
- Socket.io + Socket.io Client
- JWT authentication

## Project Structure

```text
backend/
  config/
  controllers/
  middleware/
  models/
  routes/
  utils/
  server.js

frontend/
  public/
  src/
    components/
    context/
    pages/
    services/
    styles/
  App.js
```

## Backend Features

- `POST /api/auth/register` for user registration
- `POST /api/auth/login` for login
- `GET /api/auth/me` for session restore
- `GET /api/users` to list other users
- `GET /api/messages/:userId` to fetch chat history
- `PATCH /api/messages/:userId/seen` to mark a conversation as seen
- Socket.io events:
  - `sendMessage`
  - `receiveMessage`
  - `messageSent`
  - `typingStart`
  - `typingStop`
  - `messageSeen`
  - `userOnline`
  - `userOffline`
  - `onlineUsers`

## Frontend Features

- Register and login screens
- Protected routing
- WhatsApp/Messenger-style two-panel chat layout
- Online/offline badges
- Auto-scrolling conversation view
- Typing indicator
- Seen and delivered states
- Emoji picker
- Mobile-friendly sidebar behavior

## Environment Setup

Create these files from the provided examples:

### Backend `.env`

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/userDB?retryWrites=true&w=majority&appName=Cluster0
MONGO_DB_NAME=userDB
MONGO_AUTH_SOURCE=admin
MONGO_SEED_ON_START=true
MONGO_DNS_SERVERS=8.8.8.8,1.1.1.1
MONGO_RETRY_MS=5000
MONGO_SERVER_SELECTION_TIMEOUT_MS=10000
MONGO_CONNECT_TIMEOUT_MS=10000
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_URL=http://localhost:5173,http://localhost:5174
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Install Dependencies

Open two terminals.

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

## Run the App

Start MongoDB locally first, then run:

### Backend server

```bash
cd backend
npm run db:check
npm run dev
```

### Frontend app

```bash
cd frontend
npm run dev
```

The React app will be available at `http://localhost:5173` and the API/socket server at `http://localhost:5000`.

## Real-Time Flow

1. User logs in and stores the JWT in `localStorage`.
2. The frontend opens a Socket.io connection using the JWT.
3. The backend verifies the token and joins the socket to a room named after the user id.
4. Sending a message stores it in MongoDB and emits it to the receiver's room.
5. Presence updates broadcast the list of online users.
6. Opening a chat marks unseen messages as seen and notifies the sender.

## Notes

- Create at least two accounts to test the one-to-one chat flow.
- Message persistence is handled with MongoDB, so refreshing keeps conversation history.
- Seen status updates work best when both users are logged in and connected to Socket.io.
- If Atlas SRV DNS lookup fails with `_mongodb._tcp`, keep `MONGO_DNS_SERVERS` set or use the non-SRV connection string from Atlas.

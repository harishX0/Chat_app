const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const {
  markConversationAsSeen,
  storeMessage,
} = require("./controllers/messageController");

const authRoutes = require("./routes/authRoutes");
const messageRoutes = require("./routes/messageRoutes");
const userRoutes = require("./routes/userRoutes");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

const onlineUsers = new Map();

const configuredOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.replace(/\/$/, "");

    if (
      configuredOrigins.includes(cleanOrigin) ||
      ["localhost", "127.0.0.1", "::1"].some((h) => cleanOrigin.includes(h))
    ) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "OPTIONS", "DELETE", "PUT"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

const io = new Server(server, {
  cors: {
    origin: corsOptions.origin,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "OPTIONS", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});

app.set("io", io);
app.set("onlineUsers", onlineUsers);

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.get("/api/health", (req, res) => {
  const dbStates = ["disconnected", "connected", "connecting", "disconnecting"];
  const database = dbStates[mongoose.connection.readyState] || "unknown";
  const isReady = database === "connected";

  res.status(isReady ? 200 : 503).json({
    status: isReady ? "ok" : "degraded",
    database,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication error"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    return next();
  } catch (error) {
    return next(new Error("Authentication error"));
  }
});

const emitOnlineUsers = () => {
  io.emit("onlineUsers", Array.from(onlineUsers.keys()));
};

io.on("connection", (socket) => {
  socket.join(socket.userId);

  const currentConnections = onlineUsers.get(socket.userId) || 0;
  onlineUsers.set(socket.userId, currentConnections + 1);

  socket.broadcast.emit("userOnline", socket.userId);
  emitOnlineUsers();

  socket.on("sendMessage", async (payload = {}, callback = () => {}) => {
    try {
      const { receiverId, message, tempId } = payload;

      if (!receiverId || !message || !message.trim()) {
        callback({ error: "Receiver and message are required." });
        return;
      }

      const savedMessage = await storeMessage({
        senderId: socket.userId,
        receiverId,
        message,
        onlineUsers,
        io,
      });

      const response = { tempId, message: savedMessage };

      io.to(socket.userId).emit("messageSent", response);
      callback(response);
    } catch (error) {
      callback({ error: error.message || "Unable to send message." });
    }
  });

  socket.on("typingStart", ({ receiverId } = {}) => {
    if (!receiverId) return;

    io.to(receiverId).emit("typingStart", { senderId: socket.userId });
  });

  socket.on("typingStop", ({ receiverId } = {}) => {
    if (!receiverId) return;

    io.to(receiverId).emit("typingStop", { senderId: socket.userId });
  });

  socket.on(
    "messageSeen",
    async ({ conversationUserId } = {}, callback = () => {}) => {
      try {
        if (!conversationUserId) {
          callback({ updated: 0 });
          return;
        }

        const payload = await markConversationAsSeen({
          senderId: conversationUserId,
          receiverId: socket.userId,
          io,
        });

        callback({ updated: payload ? payload.messageIds.length : 0 });
      } catch (error) {
        callback({ error: error.message || "Unable to update message status." });
      }
    }
  );

  socket.on("disconnect", () => {
    const remainingConnections = (onlineUsers.get(socket.userId) || 1) - 1;

    if (remainingConnections <= 0) {
      onlineUsers.delete(socket.userId);
      socket.broadcast.emit("userOffline", socket.userId);
      emitOnlineUsers();
      return;
    }

    onlineUsers.set(socket.userId, remainingConnections);
    emitOnlineUsers();
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
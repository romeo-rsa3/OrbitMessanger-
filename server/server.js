const express = require("express");
const cors = require("cors");
const http = require("http");
const mongoose = require("mongoose");
const socketIO = require("socket.io");


const User = require("./models/User");
const authRoutes = require("./routes/auth");


const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: "*" },
});

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use("/auth", authRoutes);

// ========== Connect to MongoDB ==========
mongoose.connect("mongodb://localhost:27017/chat-app", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => console.error("❌ MongoDB error:", err));

// ========== REST ENDPOINTS ==========

// Get list of usernames
app.get("/users", async (req, res) => {
  const users = await User.find().select("username -_id");
  res.json(users.map(u => u.username));
});

// Hardcoded groups (can be extended to a collection)
app.get("/groups", (req, res) => {
  res.json(["Space Crew", "Astro Coders", "Lunar Lounge"]);
});

// Get private chat history
app.get("/history/private", async (req, res) => {
  const { user1, user2 } = req.query;
  if (!user1 || !user2) return res.status(400).json({ error: "Missing params" });

  const messages = await Message.find({
    $or: [
      { from: user1, to: user2 },
      { from: user2, to: user1 }
    ],
    type: "private"
  }).sort({ timestamp: 1 });

  res.json(messages);
});

// Get group chat history
app.get("/history/group", async (req, res) => {
  const { group } = req.query;
  if (!group) return res.status(400).json({ error: "Missing group param" });

  const messages = await Message.find({ group, type: "group" }).sort({ timestamp: 1 });
  res.json(messages);
});

// ========== SOCKET.IO ==========

io.on("connection", (socket) => {
  console.log("🟢 New client connected:", socket.id);

  // Notify when a user logs in
  socket.on("login", ({ username }) => {
    socket.username = username;
    io.emit("user_status", { user: username, status: "online" });
  });

  // Handle private message
  socket.on("private_message", async (data) => {
    const message = new Message({ ...data, type: "private", timestamp: new Date() });
    await message.save();
    io.emit("receive_message", message);
  });

  // Handle group message
  socket.on("group_message", async (data) => {
    const message = new Message({ ...data, type: "group", timestamp: new Date() });
    await message.save();
    io.emit("receive_message", message);
  });

  socket.on("disconnect", () => {
    if (socket.username) {
      io.emit("user_status", { user: socket.username, status: "offline" });
    }
    console.log("🔴 Client disconnected:", socket.id);
  });
});

// ========== START SERVER ==========
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

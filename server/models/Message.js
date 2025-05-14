const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String },
  group: { type: String },
  read: { type: Boolean, default: false },
  message: { type: String, required: true },
  type: { type: String, enum: ["private", "group"], required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Message", messageSchema);

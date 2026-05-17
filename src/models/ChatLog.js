const mongoose = require('mongoose');

const chatLogSchema = new mongoose.Schema(
  {
    ip: String,
    country: { type: String, default: 'Unknown' },
    city: { type: String, default: 'Unknown' },
    message: { type: String, required: true },
    response: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatLog', chatLogSchema);

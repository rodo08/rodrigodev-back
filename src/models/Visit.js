const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema(
  {
    ipHash: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Visit', visitSchema);

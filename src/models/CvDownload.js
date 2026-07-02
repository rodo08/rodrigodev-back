const mongoose = require('mongoose');

// Cada descarga es un documento (con timestamp). El total = countDocuments.
// Sin dedup: cuenta descargas, no personas únicas.
const cvDownloadSchema = new mongoose.Schema({}, { timestamps: true });

module.exports = mongoose.model('CvDownload', cvDownloadSchema);

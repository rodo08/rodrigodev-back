const express = require('express');
const CvDownload = require('../models/CvDownload');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    await CvDownload.create({});
    const total = await CvDownload.countDocuments();
    res.json({ total });
  } catch (error) {
    console.error('CV download error:', error);
    res.status(500).json({ error: 'Failed to register download' });
  }
});

module.exports = router;

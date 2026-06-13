const express = require('express');
const crypto = require('crypto');
const Visit = require('../models/Visit');

const router = express.Router();

// La IP se usa solo de paso para calcular un hash irreversible (salt secreto
// en .env). Nunca se almacena la IP en crudo: solo persiste el hash.
const hashIp = (ip) =>
  crypto
    .createHash('sha256')
    .update(`${process.env.IP_HASH_SALT}${ip}`)
    .digest('hex');

router.post('/', async (req, res) => {
  try {
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.socket.remoteAddress;

    if (ip) {
      const ipHash = hashIp(ip);
      try {
        // El índice único + upsert deduplica de forma atómica: si el hash ya
        // existe no suma; si es nuevo, lo inserta.
        await Visit.updateOne(
          { ipHash },
          { $setOnInsert: { ipHash } },
          { upsert: true }
        );
      } catch (err) {
        // Ignora la carrera de dos primeras visitas simultáneas de la misma IP.
        if (err.code !== 11000) throw err;
      }
    }

    const total = await Visit.countDocuments();
    res.json({ total });
  } catch (error) {
    console.error('Visits error:', error);
    res.status(500).json({ error: 'Failed to register visit' });
  }
});

module.exports = router;

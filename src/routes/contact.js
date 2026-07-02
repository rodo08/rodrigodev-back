const express = require('express');
const ContactMessage = require('../models/ContactMessage');

const router = express.Router();

// Validación mínima en el server: nunca confiar en el cliente.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LIMITS = { name: 120, email: 200, subject: 200, message: 5000 };

router.post('/', async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    const email = (req.body.email || '').trim();
    const subject = (req.body.subject || '').trim();
    const message = (req.body.message || '').trim();

    // Campos requeridos (name es opcional).
    if (!email || !subject || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    // Topes de longitud: evita payloads gigantes / abuso.
    if (
      name.length > LIMITS.name ||
      email.length > LIMITS.email ||
      subject.length > LIMITS.subject ||
      message.length > LIMITS.message
    ) {
      return res.status(400).json({ error: 'Field too long' });
    }

    await ContactMessage.create({ name, email, subject, message });
    res.status(201).json({ ok: true });
  } catch (error) {
    console.error('Contact error:', error);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

module.exports = router;

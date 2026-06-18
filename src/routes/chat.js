const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const ChatLog = require('../models/ChatLog');
const systemInstruction = require('../config/systemInstruction');

const router = express.Router();

const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAi.getGenerativeModel({
  model: 'gemini-2.5-flash-lite',
  systemInstruction,
});

const isValidHistory = (history) =>
  Array.isArray(history) &&
  history.every(
    (entry) =>
      typeof entry === 'object' &&
      ['user', 'model'].includes(entry.role) &&
      Array.isArray(entry.parts) &&
      entry.parts.every((p) => typeof p?.text === 'string')
  );

const getFriendlyError = (status) => {
  if (status === 429) return "Looks like I got famous today — ran out of tokens to answer! Try again in a little while.";
  if (status === 503) return "I seem to be taking a nap right now. Give me a second and try again!";
  return "Something went sideways on my end. Try again later!";
};

const getGeoData = async (ip) => {
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city`);
    const data = await res.json();
    if (data.status === 'success') return { country: data.country, city: data.city };
  } catch {}
  return { country: 'Unknown', city: 'Unknown' };
};

router.post('/', async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!isValidHistory(history)) {
    return res.status(400).json({ error: 'Invalid history format' });
  }

  // La IP se usa solo de paso para obtener el país/ciudad; nunca se almacena.
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket.remoteAddress;

  const chat = model.startChat({ history });

  try {
    const [result, geo] = await Promise.all([
      chat.sendMessage(message),
      getGeoData(ip),
    ]);

    const aiResponse = result.response.text();

    await ChatLog.create({ country: geo.country, city: geo.city, message, response: aiResponse });

    res.json({ response: aiResponse });
  } catch (error) {
    console.error('Chat error:', error);

    const status = error?.status ?? error?.statusCode ?? 500;
    const friendlyMessage = getFriendlyError(status);

    res.status(500).json({ error: friendlyMessage });
  }
});

module.exports = router;

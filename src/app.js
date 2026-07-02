require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const chatRouter = require('./routes/chat');
const sapeoRouter = require('./routes/sapeo');
const visitsRouter = require('./routes/visits');
const contactRouter = require('./routes/contact');
const cvDownloadsRouter = require('./routes/cvDownloads');

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/chat', chatRouter);
app.use('/api/visits', visitsRouter);
app.use('/api/contact', contactRouter);
app.use('/api/cv-downloads', cvDownloadsRouter);
app.use('/sapeo', sapeoRouter);

const keepAlive = () => {
  const url = process.env.RENDER_EXTERNAL_URL;
  if (!url) return;

  const FOURTEEN_MINUTES = 14 * 60 * 1000;

  setInterval(async () => {
    try {
      await fetch(`${url}/health`);
      console.log(`[keep-alive] ping sent to ${url}/health`);
    } catch (err) {
      console.error('[keep-alive] ping failed:', err.message);
    }
  }, FOURTEEN_MINUTES);
};

const PORT = process.env.PORT || 3001;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      keepAlive();
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

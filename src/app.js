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

// Sonda de estado, sin keep-alive: en el plan free de Render el servicio duerme
// tras 15 min sin tráfico y lo despierta el POST /api/visits que el frontend
// dispara al cargar la página.
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/chat', chatRouter);
app.use('/api/visits', visitsRouter);
app.use('/api/contact', contactRouter);
app.use('/api/cv-downloads', cvDownloadsRouter);
app.use('/sapeo', sapeoRouter);

const PORT = process.env.PORT || 3001;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

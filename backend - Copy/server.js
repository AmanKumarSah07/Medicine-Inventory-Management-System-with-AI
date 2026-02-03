// app.js (or server.js)
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from './config/db.js';
import logsRouter from './routes/logs.js'; // path to your router file
// import other routers/middlewares as needed

const app = express();
app.use(express.json());

// connect to MongoDB
connectDB().catch(err => {
  console.error('Failed to connect DB at startup', err);
  process.exit(1);
});

// Example: request logger (optional)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// Mount the logs router on /api/logs
app.use('/api/logs', logsRouter);

// Generic error handler (you already use asyncHandler in routes; this is fallback)
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

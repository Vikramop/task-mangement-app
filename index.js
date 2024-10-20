import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './db/connectDb.js';
import authRoutes from './routes/auth.routes.js';
import taskRoutes from './routes/task.routes.js';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: '*',
  })
);

app.use(express.json()); // middleware, parses req.body

app.use('/api/task', taskRoutes);

app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  connectDB();
  console.log('Server is running on port ', PORT);
});

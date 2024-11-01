import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './db/connectDb.js';
import authRoutes from './routes/auth.routes.js';
import taskRoutes from './routes/task.routes.js';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to handle CORS
app.use(
  cors({
    origin: '*',
  })
);

app.use(express.json()); // Parses req.body

// Serve API routes
app.use('/api/task', taskRoutes);
app.use('/api/auth', authRoutes);

// Serve the frontend files (React build directory)
const __dirname = path.resolve(); // Get the directory path
app.use(express.static(path.join(__dirname, 'build')));

// Catch-all route to serve `index.html` for unmatched routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  connectDB();
  console.log('Server is running on port', PORT);
});

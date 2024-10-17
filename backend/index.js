import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './db/connectDb.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json()); // middleware, parses req.body

app.listen(PORT, () => {
  connectDB();
  console.log('Server is running on port ', PORT);
});

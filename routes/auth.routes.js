import express from 'express';
import {
  signup,
  login,
  logout,
  update,
} from '../controller/auth.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.post('/signup', signup);

router.post('/login', login);

router.post('/logout', logout);

router.put('/update', verifyToken, update);

export default router;

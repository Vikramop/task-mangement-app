import express from 'express';
import {
  signup,
  login,
  logout,
  update,
  getUser,
} from '../controller/auth.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.post('/signup', signup);

router.post('/login', login);

router.post('/logout', logout);

router.put('/update', verifyToken, update);

router.get('/user', verifyToken, getUser);

export default router;

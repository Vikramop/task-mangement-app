import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import {
  createTask,
  deleteTask,
  getTasks,
  shareTask,
  getTaskById,
  editTask,
} from '../controller/task.controller.js';

const router = express.Router();

//Routes for Tasks
router.post('/', verifyToken, createTask);

router.get('/', verifyToken, getTasks);

router.put('/:taskId', verifyToken, editTask);

router.delete('/:taskId', deleteTask);

router.post('/share/:taskId', shareTask);

router.get('/:taskId', getTaskById);

export default router;

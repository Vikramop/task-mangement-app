import mongoose from 'mongoose';
// import { User } from './user.modal.js';

const checklistItemSchema = new mongoose.Schema({
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
});

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: {
    type: String,
    enum: ['Backlog', 'In Progress', 'To-Do', 'Done'],
    required: true,
  },
  priority: {
    type: String,
    enum: ['high', 'moderate', 'low'],
    required: true,
  },
  checklist: [checklistItemSchema],
  assignedTo: { type: String, optional: true },
  dueDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

// Middleware to update the updatedAt field
taskSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export const Task = mongoose.model('task', taskSchema);

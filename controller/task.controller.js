import { Task } from '../modal/task.modal.js';
import { User } from '../modal/user.modal.js';
import jwt from 'jsonwebtoken';

const priority = (dueDate) => {
  const currentDate = new Date();
  const taskDueDate = new Date(dueDate);

  const timeDifference = taskDueDate - currentDate;
  const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

  if (daysDifference < 0) {
    return 'high'; // Overdue
  } else if (daysDifference === 0 || daysDifference === 1) {
    return 'moderate'; // Due today or tomorrow
  } else {
    return 'low'; // More than two days remaining
  }
};

export const createTask = async (req, res) => {
  const { title, checklist, dueDate, assignedTo, priority, category } =
    req.body;

  try {
    const user = await User.findById(req.userId); // Find user by their ID
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    if (!title || !checklist || !priority) {
      throw new Error('Please fill in all required fields');
    }

    const userId = req.userId;
    console.log('user', userId);

    // If the user selects a priority at creation, use it, otherwise adjust based on date
    const calculatedPriority = priority || priority(dueDate);

    const task = new Task({
      title,
      category,
      checklist,
      dueDate,
      assignedTo,
      priority: calculatedPriority,
      createdBy: userId,
    });

    await task.save();

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ createdBy: req.userId });

    // Adjust priority of each task based on the due date
    tasks.forEach((task) => {
      task.priority = priority(task.dueDate);
    });

    res.status(200).json({
      success: true,
      tasks,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const editTask = async (req, res) => {
  const { title, checklist, dueDate, assignedTo, priority, category } =
    req.body;
  const { taskId } = req.params; // Assuming the task ID is passed in the URL

  try {
    const task = await Task.findById(taskId); // Find the task by ID
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: 'Task not found' });
    }

    // Update task fields if provided
    if (title) task.title = title;
    if (category) task.category = category;
    if (checklist) task.checklist = checklist; // Assuming checklist is an array
    if (dueDate) task.dueDate = dueDate;
    if (assignedTo) task.assignedTo = assignedTo;
    if (priority) task.priority = priority;

    await task.save(); // Save the updated task

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteTask = async (req, res) => {
  const { taskId } = req.params; // Assuming the task ID is passed in the URL

  try {
    const task = await Task.findById(taskId); // Find the task by ID
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: 'Task not found' });
    }

    await Task.findByIdAndDelete(taskId); // Delete the task

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const shareTask = async (req, res) => {
  const { taskId } = req.params;

  try {
    // Find the task by ID
    const task = await Task.findById(taskId);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: 'Task not found' });
    }

    const shareableLink = `${process.env.BASE_URL}/api/task/${taskId}`; // BASE_URL should be your API base URL

    res.status(200).json({
      success: true,
      message: 'Task shared successfully',
      link: shareableLink,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getTaskById = async (req, res) => {
  const { taskId } = req.params;

  try {
    const task = await Task.findById(taskId).populate(
      'createdBy',
      'name email'
    );

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: 'Task not found' });
    }

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

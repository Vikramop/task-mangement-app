import { Task } from '../model/task.model.js';
import { User } from '../model/user.model.js';
import jwt from 'jsonwebtoken';

const priority = (dueDate) => {
  const currentDate = new Date();
  const taskDueDate = new Date(dueDate);

  const timeDifference = taskDueDate - currentDate;
  const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

  if (daysDifference < 0) {
    return 'high';
  } else if (daysDifference === 0) {
    return 'moderate'; // Due today
  } else {
    return 'low'; // More than two days
  }
};

export const createTask = async (req, res) => {
  const { title, checklist, dueDate, assignedTo, priority, category } =
    req.body;

  console.log(title, checklist, dueDate, assignedTo, priority, category);

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    if (!title || !checklist || !priority) {
      throw new Error('Please fill in all required fields');
    }

    if (checklist.length > 0) {
      checklist.forEach((item) => {
        if (!item.text) {
          throw new Error('Please fill in all required fields');
        }
      });
    }
    if (!dueDate) {
      throw new Error('Please Select a Due Date');
    }

    const assignee = await User.findOne({ email: assignedTo });
    if (!assignee) {
      return res.status(400).json({
        success: false,
        message: `The email ${assignedTo} has no account! please create one.`,
      });
    }

    // Calculate priority based on due date if the user hasn't set a priority
    const currentDate = new Date();
    const taskDueDate = new Date(dueDate);

    let calculatedPriority = priority || 'low';

    // If the user provides moderate or low  priority but the due date is today or in the past, set priority to 'high'
    if (priority === ('moderate' || 'low') && taskDueDate <= currentDate) {
      calculatedPriority = 'high';
    }

    const userId = req.userId;
    // console.log('user', userId);

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
    // Find tasks created by or assigned to the current user
    const tasks = await Task.find({
      $or: [{ createdBy: req.userId }, { assignedTo: req.userId }],
    })
      .populate('assignedTo', 'email') // Populate only the email field of assigned user
      .populate('createdBy', 'email');

    // Transform `assignedTo` to just email string in each task object
    const transformedTasks = tasks.map((task) => ({
      ...task.toObject(),
      assignedTo: task.assignedTo ? task.assignedTo.email : null, // use only email here
    }));

    res.status(200).json({
      success: true,
      tasks: transformedTasks,
    });
  } catch (error) {
    console.error('Error fetching tasks:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const editTask = async (req, res) => {
  const { title, checklist, dueDate, assignedTo, priority, category } =
    req.body;
  const { taskId } = req.params;

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: 'Task not found' });
    }

    // Check if the user is authorized to edit (creator or assignee)
    if (
      task.createdBy.toString() !== req.userId &&
      task.assignedTo?.toString() !== req.userId
    ) {
      return res
        .status(403)
        .json({ success: false, message: 'Not authorized to edit this task' });
    }

    // Update task details
    if (title) task.title = title;
    if (category) task.category = category;
    if (checklist) task.checklist = checklist;
    if (dueDate) task.dueDate = dueDate;
    if (priority) task.priority = priority;

    // Assign task if `assignedTo` email is provided
    if (assignedTo) {
      const assignee = await User.findOne({ email: assignedTo });
      if (!assignee) {
        return res.status(400).json({
          success: false,
          message: `The email ${assignedTo} has no account! Please create one.`,
        });
      }
      task.assignedTo = assignee._id; // Assign the ObjectId of the assignee
    }

    await task.save();

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
  const { taskId } = req.params;

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: 'Task not found' });
    }

    await Task.findByIdAndDelete(taskId);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      task,
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

    // Update this line to point to the frontend route
    const shareableLink = `${process.env.FRONT_URL}/task/${taskId}`; // Pointing to the frontend route

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

    res.status(200).json({ success: true, task });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, message: error.message });
  }
};

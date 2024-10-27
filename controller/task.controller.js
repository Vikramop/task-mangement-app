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
  const {
    title,
    checklist,
    dueDate,
    assignedTo = null,
    priority,
    category,
  } = req.body;

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

    // Only check for the assignee if it's provided
    let assignee = null;
    if (assignedTo) {
      assignee = await User.findOne({ email: assignedTo });
      if (!assignee) {
        return res.status(400).json({
          success: false,
          message: `The assignee email ${assignedTo} has no account! Please create one.`,
        });
      }
    }

    // Calculate priority based on due date if the user hasn't set a priority
    const currentDate = new Date();
    const taskDueDate = new Date(dueDate);

    let calculatedPriority = priority || 'low';

    // If the user provides moderate or low priority but the due date is today or in the past, set priority to 'high'
    if (priority === ('moderate' || 'low') && taskDueDate <= currentDate) {
      calculatedPriority = 'high';
    }

    const userId = req.userId;

    const task = new Task({
      title,
      category,
      checklist,
      dueDate,
      assignedTo, // Set to null if no assignee
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
    // Find the current user to get their email
    const user = await User.findById(req.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    const userEmail = user.email; // Get the user's email

    // Find tasks created by or assigned to the current user
    const tasks = await Task.find({
      $or: [{ createdBy: req.userId }, { assignedTo: userEmail }], // Use user's email to find assigned tasks
    });

    // Directly return the tasks with assignedTo as a string
    const transformedTasks = tasks.map((task) => ({
      ...task.toObject(),
      assignedTo: task.assignedTo || null, // Keep assignedTo as the email string
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
    // if (
    //   task.createdBy.toString() !== req.userId &&
    //   task.assignedTo !== req.user.email // Check against email directly
    // ) {
    //   return res
    //     .status(403)
    //     .json({ success: false, message: 'Not authorized to edit this task' });
    // }

    // Update task details
    if (title) task.title = title;
    if (category) task.category = category;
    if (checklist) task.checklist = checklist;
    if (dueDate) task.dueDate = dueDate;
    if (priority) task.priority = priority;

    // Assign task if `assignedTo` email is provided
    if (assignedTo) {
      // Check if the email exists in the User collection
      const assignee = await User.findOne({ email: assignedTo });
      if (!assignee) {
        return res.status(400).json({
          success: false,
          message: `The email ${assignedTo} has no account! Please create one.`,
        });
      }
      task.assignedTo = assignedTo; // Store the email string directly
    }

    await task.save();

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task: {
        ...task.toObject(),
        assignedTo: task.assignedTo, // Ensure assignedTo is returned as a string
      },
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

export const getTaskAnalytics = async (req, res) => {
  try {
    // console.log('User ID:', req.userId);
    if (!req.userId) {
      return res.status(400).json({
        success: false,
        message: 'User not authenticated or userId not found.',
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Find tasks created by or assigned to the current user's email
    const tasks = await Task.find({
      $or: [{ createdBy: req.userId }, { assignedTo: user.email }],
    });

    // console.log('taskskss', tasks);

    const analyticsData = {
      backlogTasks: tasks.filter((task) => task.category === 'Backlog').length,
      toDoTasks: tasks.filter((task) => task.category === 'To-Do').length,
      inProgressTasks: tasks.filter((task) => task.category === 'In Progress')
        .length,
      completedTasks: tasks.filter((task) => task.category === 'Done').length,
      lowPriority: tasks.filter((task) => task.priority === 'low').length,
      moderatePriority: tasks.filter((task) => task.priority === 'moderate')
        .length,
      highPriority: tasks.filter((task) => task.priority === 'high').length,
      dueDateTasks: tasks.filter(
        (task) => task.dueDate && task.dueDate < new Date()
      ).length,
    };
    // console.log('daaata', analyticsData);

    res.status(200).json({
      success: true,
      analyticsData,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Error fetching analytics', error });
  }
};

export const addAssignee = async (req, res) => {
  const { email } = req.body; // Expecting email in the request body
  const mainUserId = req.userId; // ID of the user making the request

  try {
    // Check if the assignee exists
    const assignee = await User.findOne({ email });

    if (!assignee) {
      return res.status(404).json({
        success: false,
        message: `The email ${email} does not belong to any registered user.`,
      });
    }

    // Get all tasks created by the main user
    const tasks = await Task.find({ createdBy: mainUserId });

    if (tasks.length > 0) {
      // Iterate through each task and update the assignedTo field
      for (const task of tasks) {
        task.assignedTo = email; // Assign the new user's email to the task
        await task.save(); // Save the updated task
      }

      return res.status(200).json({
        success: true,
        message: `All tasks have been assigned to user with email ${email}.`,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'No tasks found for the main user.',
      });
    }
  } catch (error) {
    console.error('Error adding assignee:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding assignee',
      error: error.message || error,
    });
  }
};

/////////////////////////////////

export const sortTasks = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    const currentDate = new Date();

    // Define the start of the current week (Sunday)
    const weeklyStart = new Date(currentDate);
    weeklyStart.setDate(currentDate.getDate() - currentDate.getDay()); // Go back to Sunday
    weeklyStart.setHours(0, 0, 0, 0); // Reset time to start of the day

    // Define the end of the current week (Saturday)
    const weeklyEnd = new Date(weeklyStart);
    weeklyEnd.setDate(weeklyStart.getDate() + 6); // Saturday of the same week
    weeklyEnd.setHours(23, 59, 59, 999); // Set to end of the day

    // Define the start of the current month (1st day)
    const monthlyStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    monthlyStart.setHours(0, 0, 0, 0); // Reset time to start of the day

    // Define the end of the current month (last day of the month)
    const monthlyEnd = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    ); // Last day of this month
    monthlyEnd.setHours(23, 59, 59, 999); // Set to end of the day

    const tasks = await Task.find({
      $or: [{ createdBy: req.userId }, { assignedTo: user.email }],
    });

    const sortedTasks = {
      daily: tasks.filter(
        (task) =>
          new Date(task.dueDate).toDateString() === currentDate.toDateString()
      ),
      weekly: tasks.filter(
        (task) =>
          new Date(task.dueDate) >= weeklyStart &&
          new Date(task.dueDate) <= weeklyEnd
      ),
      monthly: tasks.filter(
        (task) =>
          new Date(task.dueDate) >= monthlyStart &&
          new Date(task.dueDate) <= monthlyEnd
      ),
      beyond: tasks.filter((task) => new Date(task.dueDate) > monthlyEnd),
    };

    res.status(200).json({
      success: true,
      tasks: sortedTasks,
    });
  } catch (error) {
    console.error('Error sorting tasks:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../modal/user.modal.js';
import { log } from 'console';

export const signup = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  console.log('name:', name);
  try {
    if (!name || !email || !password || !confirmPassword) {
      throw new Error('please enter all the fields');
    }

    if (password != confirmPassword) {
      throw new Error('Passwords are not matching');
    }

    const userAlreadyExists = await User.findOne({ email });
    console.log('user already exists', userAlreadyExists);

    if (userAlreadyExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }
    const hashedPassword = await bcryptjs.hash(password, 10);
    const user = new User({
      email,
      password: hashedPassword,
      name,
    });

    await user.save();
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

    res.status(201).json({
      success: true,
      message: 'user created successfully',
      user: {
        ...user._doc,
        password: undefined,
        token,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: 'User not found please register' });
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ success: false, message: 'Password do not match' });
    }
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
    res.status(200).json({
      success: true,
      message: 'User logged in successfully',
      user: {
        ...user._doc,
        password: undefined,
        token,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const logout = async (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

export const update = async (req, res) => {
  const { name, email, oldPassword, newPassword } = req.body;

  const userId = req.userId;

  try {
    // Find the user by ID
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Check if email is being updated and ensure it's not already in use
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use',
        });
      }
    }

    // Handle password update
    if (newPassword || oldPassword) {
      if (!oldPassword) {
        throw new Error('Old password is required to change the password');
      }

      const isOldPasswordValid = await bcryptjs.compare(
        oldPassword,
        user.password
      );
      if (!isOldPasswordValid) {
        throw new Error('Old password is incorrect');
      }

      const hashedNewPassword = await bcryptjs.hash(newPassword, 10);
      user.password = hashedNewPassword; // Update password
    }

    // Update name and/or email if provided
    if (name) {
      user.name = name;
    }
    if (email) {
      user.email = email;
    }

    // Save the updated user information
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User credentials updated successfully',
      user: {
        ...user._doc,
        password: undefined, // Do not return the password in the response
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

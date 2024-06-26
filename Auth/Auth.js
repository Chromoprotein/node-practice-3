const bcrypt = require("bcryptjs")
// The user schema
const User = require("../User")

// User authentication with JSON Web Token
const jwt = require('jsonwebtoken')
require('dotenv').config()
const jwtSecret = process.env.JWT_SECRET;

// Register function
exports.register = async (req, res, next) => {
  const { username, password } = req.body;
  if (password.length < 6) {
    return res.status(400).json({ message: "Password less than 6 characters" });
  }
  
  try {
    const hash = await bcrypt.hash(password, 10); // Hash the password asynchronously
    const user = await User.create({
      username,
      password: hash,
    });

    const maxAge = 3 * 60 * 60; // 3 hours in seconds
    const token = jwt.sign(
      { id: user._id, username, role: user.role },
      jwtSecret,
      { expiresIn: maxAge }
    );

    res.cookie("jwt", token, {
      path: '/',
      httpOnly: true,
      maxAge: maxAge * 1000, // 3 hours in milliseconds
    });
    
    res.status(201).json({
      message: "User successfully created",
      user: user._id,
    });
  } catch (error) {
    res.status(400).json({
      message: "User not successfully created",
      error: error.message,
    });
  }
};

// Login function
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        message: "Username or Password not present",
      });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({
        message: "Login not successful",
        error: "User not found",
      });
    }

    // comparing given password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      const maxAge = 3 * 60 * 60; // 3 hours in seconds
      const token = jwt.sign(
        { id: user._id, username, role: user.role },
        jwtSecret,
        { expiresIn: maxAge }
      );

      res.cookie("jwt", token, {
        path: '/',
        httpOnly: true,
        maxAge: maxAge * 1000, // Convert to milliseconds
      });

      res.status(201).json({
        message: "User successfully logged in",
        user: user._id,
      });
    } else {
      res.status(400).json({ message: "Login not successful" });
    }
  } catch (error) {
    res.status(400).json({
      message: "An error occurred",
      error: error.message,
    });
  }
};


// Update basic user to admin
exports.update = async (req, res, next) => {
  const { role, id } = req.body;
  // Verifying if role and id is present
  if (role && id) {
    // Verifying if the value of role is admin
    if (role === "admin") {
      try {
        const user = await User.findById(id);
        // Verifies the found user is not already an admin
        if (user.role !== "admin") {
          user.role = role;
          // Save the user with the updated role
          await user.save();
          res.status(201).json({ message: "Update successful", user });
        } else {
          res.status(400).json({ message: "User is already an Admin" });
        }
      } catch (error) {
        res.status(400).json({ message: "An error occurred", error: error.message });
      }
    } else {
      res.status(400).json({ message: "Role is not admin" });
    }
  } else {
    res.status(400).json({ message: "Role or Id not present" });
  }
};

// Delete a user
exports.deleteUser = async (req, res, next) => {
  const { id } = req.body;
  try {
    const user = await User.findOneAndDelete({ _id: id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(201).json({ message: "User successfully deleted", user });
  } catch (error) {
    res.status(400).json({ message: "An error occurred", error: error.message });
  }
};

// Lists all the users
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find({})
    if(users) {
      const userFunction = users.map(user => {
        const container = {}
        container.id = user.id
        container.username = user.username
        container.role = user.role
        return container
      })
      res.status(200).json({ user: userFunction })
    }
  }
  catch (err) {
    res.status(401).json({ message: "Not successful", error: err.message })
  }

}

// Checks if the user is logged in or an admin, for rendering content
exports.userStatus = async (req, res, next) => {
  const token = req.cookies.jwt
  if (token) {
    jwt.verify(token, jwtSecret, (err, decodedToken) => {
      if (err) {
        return res.json({ isAuthenticated: false })
      } else {
        return res.json({ isAuthenticated: true, role: decodedToken.role })
      }
    })
  } else {
    return res
      .json({ isAuthenticated: false })
  }
}

exports.logout = (req, res) => {
  res.cookie('jwt', '', { maxAge: 1 }); // Set the jwt cookie to expire immediately
  res.status(200).json({ message: 'Logged out successfully' });
};
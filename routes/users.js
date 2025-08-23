// routes/users.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Create user (role-based)
router.post('/', auth, async (req, res) => {
  const { email, password, role, companyId } = req.body;
  const requestingUser = req.user;

  try {
    // Authorization checks
    if (requestingUser.role === 'super_admin') {
      // Super admin can create any user type
    } else if (requestingUser.role === 'admin') {
      // Admin can only create supervisors and employees for their company
      if (role === 'super_admin' || role === 'admin') {
        return res.status(403).json({ message: 'Not authorized to create this role' });
      }
      if (companyId !== requestingUser.company.toString()) {
        return res.status(403).json({ message: 'Not authorized for this company' });
      }
    } else {
      return res.status(403).json({ message: 'Not authorized to create users' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({
      email,
      password,
      role,
      company: companyId
    });

    await user.save();

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create company (super admin only)
router.post('/companies', auth, async (req, res) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Only super admins can create companies' });
  }

  const { name } = req.body;

  try {
    const company = new Company({
      name,
      createdBy: req.user.id
    });

    await company.save();
    res.status(201).json(company);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
// routes/admin.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { runQuery, runSingle, runExecute } = require('../config/database');
const { authenticateToken } = require('./auth');
const router = express.Router();

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Middleware to check if user is super admin
const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
};

// Get all users (admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role, u.is_active, u.created_at,
             a.admin_level, a.can_manage_users, a.can_manage_establishments, a.can_view_reports
      FROM users u
      LEFT JOIN administrators a ON u.id = a.user_id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)`;
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (role) {
      paramCount++;
      query += ` AND u.role = ?`;
      queryParams.push(role);
    }

    query += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
    queryParams.push(parseInt(limit), offset);

    const users = await runQuery(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM users u WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (search) {
      countParamCount++;
      countQuery += ` AND (u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (role) {
      countParamCount++;
      countQuery += ` AND u.role = ?`;
      countParams.push(role);
    }

    const countResult = await runSingle(countQuery, countParams);
    const totalUsers = countResult.count;

    res.json({
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
        isActive: user.is_active,
        createdAt: user.created_at,
        admin: user.admin_level ? {
          level: user.admin_level,
          canManageUsers: user.can_manage_users,
          canManageEstablishments: user.can_manage_establishments,
          canViewReports: user.can_view_reports
        } : null
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalUsers,
        pages: Math.ceil(totalUsers / limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new user (admin only)
router.post('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role = 'user' } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Email, password, first name, and last name are required' });
    }

    // Check if user already exists
    const existingUser = await runSingle('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await runExecute(
      'INSERT INTO users (email, password_hash, first_name, last_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
      [email, passwordHash, firstName, lastName, phone, role]
    );

    // If user is admin, create administrator record
    if (role === 'admin' || role === 'super_admin') {
      await runExecute(
        'INSERT INTO administrators (user_id, admin_level, can_manage_users, can_manage_establishments) VALUES (?, ?, ?, ?)',
        [result.id, role, 1, 1]
      );
    }

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: result.id,
        email,
        firstName,
        lastName,
        phone,
        role
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user (admin only)
router.put('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, role, isActive } = req.body;

    // Check if user exists
    const existingUser = await runSingle('SELECT id, role FROM users WHERE id = ?', [id]);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user
    await runExecute(
      'UPDATE users SET first_name = ?, last_name = ?, phone = ?, role = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [firstName, lastName, phone, role, isActive ? 1 : 0, id]
    );

    // Handle administrator record
    if (role === 'admin' || role === 'super_admin') {
      const existingAdmin = await runSingle('SELECT id FROM administrators WHERE user_id = ?', [id]);
      if (!existingAdmin) {
        await runExecute(
          'INSERT INTO administrators (user_id, admin_level, can_manage_users, can_manage_establishments) VALUES (?, ?, ?, ?)',
          [id, role, 1, 1]
        );
      } else {
        await runExecute(
          'UPDATE administrators SET admin_level = ? WHERE user_id = ?',
          [role, id]
        );
      }
    } else {
      // Remove administrator record if role is not admin
      await runExecute('DELETE FROM administrators WHERE user_id = ?', [id]);
    }

    res.json({ message: 'User updated successfully' });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (super admin only)
router.delete('/users/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await runSingle('SELECT id FROM users WHERE id = ?', [id]);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't allow deleting super admin users
    const userRole = await runSingle('SELECT role FROM users WHERE id = ?', [id]);
    if (userRole.role === 'super_admin') {
      return res.status(403).json({ error: 'Cannot delete super admin users' });
    }

    // Delete user (cascade will handle related records)
    await runExecute('DELETE FROM users WHERE id = ?', [id]);

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID (admin only)
router.get('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await runSingle(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role, u.is_active, u.created_at,
             a.admin_level, a.can_manage_users, a.can_manage_establishments, a.can_view_reports
      FROM users u
      LEFT JOIN administrators a ON u.id = a.user_id
      WHERE u.id = ?
    `, [id]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
        isActive: user.is_active,
        createdAt: user.created_at,
        admin: user.admin_level ? {
          level: user.admin_level,
          canManageUsers: user.can_manage_users,
          canManageEstablishments: user.can_manage_establishments,
          canViewReports: user.can_view_reports
        } : null
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get dashboard stats (admin only)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await runSingle(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'admin' OR role = 'super_admin') as total_admins,
        (SELECT COUNT(*) FROM users WHERE is_active = 1) as active_users,
        (SELECT COUNT(*) FROM establishments) as total_establishments
    `);

    res.json({
      totalUsers: stats.total_users,
      totalAdmins: stats.total_admins,
      activeUsers: stats.active_users,
      totalEstablishments: stats.total_establishments
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
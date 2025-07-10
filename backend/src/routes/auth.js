const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Department = require('../models/Department');
const UserRole = require('../models/UserRole');
const Role = require('../models/Role');

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, real_name, department_id } = req.body;
    if (!username || !password || !real_name || !department_id) {
      return res.status(400).json({ message: '参数不完整' });
    }
    const exist = await User.findOne({ where: { username } });
    if (exist) return res.status(409).json({ message: '用户名已存在' });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hash, real_name, department_id });
    // 默认普通用户角色
    const role = await Role.findOne({ where: { name: 'user' } });
    if (role) await UserRole.create({ user_id: user.id, role_id: role.id });
    res.json({ message: '注册成功' });
  } catch (err) {
    res.status(500).json({ message: '注册失败', error: err.message });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(401).json({ message: '用户名或密码错误' });
    
    // 支持明文密码验证（开发测试用）
    let valid = false;
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      // 加密密码验证
      valid = await bcrypt.compare(password, user.password);
    } else {
      // 明文密码验证（开发测试）
      valid = password === user.password;
    }
    
    if (!valid) return res.status(401).json({ message: '用户名或密码错误' });
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '2d' });
    res.json({ token, user: { id: user.id, username: user.username, real_name: user.real_name, department_id: user.department_id } });
  } catch (err) {
    res.status(500).json({ message: '登录失败', error: err.message });
  }
});


// 找回密码/重置密码
router.post('/forgot', async (req, res) => {
  try {
    const { username, newPassword } = req.body;
    if (!username || !newPassword) {
      return res.status(400).json({ message: '参数不完整' });
    }
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(404).json({ message: '用户不存在' });
    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    await user.save();
    res.json({ message: '密码重置成功' });
  } catch (err) {
    res.status(500).json({ message: '重置失败', error: err.message });
  }
});

module.exports = router;

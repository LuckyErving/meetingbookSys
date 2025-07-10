const express = require('express');
const router = express.Router();
const Department = require('../models/Department');

// 获取所有单位
router.get('/', async (req, res) => {
  try {
    const list = await Department.findAll();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: '获取单位失败', error: err.message });
  }
});

module.exports = router;

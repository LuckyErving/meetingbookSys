const express = require('express');
const router = express.Router();
const MeetingRoom = require('../models/MeetingRoom');

// 获取所有会议室
router.get('/', async (req, res) => {
  try {
    const list = await MeetingRoom.findAll();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: '获取会议室失败', error: err.message });
  }
});

module.exports = router;

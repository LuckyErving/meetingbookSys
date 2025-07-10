require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const db = require('./config/db');

app.use(cors());
app.use(express.json());


// 用户注册/登录
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// 单位相关
const deptRoutes = require('./routes/departments');
app.use('/api/departments', deptRoutes);

// 会议室相关
const roomRoutes = require('./routes/rooms');
app.use('/api/rooms', roomRoutes);

// 会议申请相关
const applicationRoutes = require('./routes/applications');
app.use('/api/applications', applicationRoutes);

// 审批相关
const approvalRoutes = require('./routes/approvals');
app.use('/api/approvals', approvalRoutes);

// 用户相关
try {
  const userRoutes = require('./routes/user');
  app.use('/api/user', userRoutes);
} catch (e) {
  // 如果没有 user 路由则忽略
}

// 路由示例
app.get('/', (req, res) => {
  res.send('MeetingBookSys Backend API');
});

// 日历专用API - 获取所有会议数据（无需认证）
app.get('/api/calendar/meetings', async (req, res) => {
  try {
    const models = require('./models');
    const MeetingApplication = models.MeetingApplication;
    const User = models.User;
    const Department = models.Department;
    const MeetingRoom = models.MeetingRoom;
    
    console.log('日历API: 获取所有申请记录...');
    const list = await MeetingApplication.findAll({
      include: [
        { model: User, as: 'applicant', attributes: ['real_name'] },
        { model: Department, as: 'applicantDepartment', attributes: ['name'] },
        { model: MeetingRoom, as: 'meetingRoom', attributes: ['name', 'location'] }
      ],
      order: [['created_at', 'DESC']],
      limit: 200 // 获取更多数据供日历显示
    });
    console.log(`日历API: 找到${list.length}条申请记录`);
    res.json({
      success: true,
      count: list.length,
      data: list
    });
  } catch (err) {
    console.error('日历API: 获取申请记录失败:', err);
    res.status(500).json({ message: '获取申请记录失败', error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

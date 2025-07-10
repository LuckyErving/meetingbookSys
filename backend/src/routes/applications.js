const express = require('express');
const router = express.Router();
// 使用统一的模型导入，确保关联关系已设置
const models = require('../models');
const MeetingApplication = models.MeetingApplication;
const MeetingRoom = models.MeetingRoom;
const ApprovalStep = models.ApprovalStep;
const Department = models.Department;
const User = models.User;
const { Op } = require('sequelize');
const auth = require('../middlewares/auth');

// 获取当前用户的会议申请记录
router.get('/mine', auth, async (req, res) => {
  try {
    console.log('查询用户申请记录，用户ID:', req.user.id);
    
    const applications = await MeetingApplication.findAll({
      where: { applicant_id: req.user.id },
      order: [['created_at', 'DESC']]
    });

    console.log('找到申请记录数量:', applications.length);
    
    // 手动获取关联数据
    const result = [];
    for (const app of applications) {
      try {
        const applicant = await User.findByPk(app.applicant_id);
        const department = await Department.findByPk(app.department_id);
        const meetingRoom = await MeetingRoom.findByPk(app.room_id);

        result.push({
          id: app.id,
          application_no: app.application_no,
          title: app.title,
          description: app.description,
          meeting_type: app.meeting_type,
          start_time: app.start_time,
          end_time: app.end_time,
          attendee_count: app.attendee_count,
          contact_person: app.contact_person,
          contact_phone: app.contact_phone,
          special_requirements: app.special_requirements,
          status: app.status,
          urgency_level: app.urgency_level,
          current_step: app.current_step,
          created_at: app.created_at,
          updated_at: app.updated_at,
          applicant: applicant ? {
            real_name: applicant.real_name,
            username: applicant.username
          } : null,
          department: department ? {
            name: department.name
          } : null,
          meeting_room: meetingRoom ? {
            name: meetingRoom.name,
            location: meetingRoom.location
          } : null
        });
      } catch (err) {
        console.error('处理申请记录数据出错:', err);
      }
    }

    console.log(`用户${req.user.id}的申请记录:`, result.length, '条');
    res.json(result);
  } catch (err) {
    console.error('获取申请记录失败:', err);
    res.status(500).json({ message: '获取申请记录失败', error: err.message });
  }
});

// 新建会议申请（含自动生成审批流）
router.post('/', auth, async (req, res) => {
  try {
    const { title, room_id, start_time, end_time, description } = req.body;
    if (!title || !room_id || !start_time || !end_time) {
      return res.status(400).json({ message: '参数不完整' });
    }
    // 转为北京时间
    function toBeijingDate(str) {
      if (!str) return null;
      
      let date;
      if (typeof str === 'string') {
        // 处理不同格式的字符串
        if (str.includes('T')) {
          // ISO格式：2025-07-09T09:00:00 或 2025-07-09T09:00:00Z
          if (str.endsWith('Z')) {
            date = new Date(str);
          } else {
            date = new Date(str + '+08:00');
          }
        } else {
          // 标准格式：2025-07-09 09:00:00
          date = new Date(str.replace(' ', 'T') + '+08:00');
        }
      } else if (str instanceof Date) {
        date = str;
      } else {
        date = new Date(str);
      }
      
      // 确保时间有效
      if (isNaN(date.getTime())) {
        return null;
      }
      
      return date;
    }

    // 先转为 Date，避免冲突判断用字符串导致数据库类型不一致
    const startDate = toBeijingDate(start_time);
    const endDate = toBeijingDate(end_time);
    if (!startDate || !endDate || isNaN(startDate) || isNaN(endDate)) {
      return res.status(400).json({ message: '时间格式错误' });
    }

    // 检查会议室是否有冲突
    // 更完善的时间冲突检测：两个时间段重叠的条件是 start1 < end2 && start2 < end1
    const conflict = await MeetingApplication.findOne({
      where: {
        room_id,
        status: { [Op.in]: ['pending', 'approved'] },
        [Op.and]: [
          { start_time: { [Op.lt]: endDate } },     // 现有开始时间 < 新结束时间
          { end_time: { [Op.gt]: startDate } }      // 现有结束时间 > 新开始时间
        ]
      }
    });
    
    if (conflict) {
      console.log('发现时间冲突:', {
        新申请: { start: startDate, end: endDate },
        冲突申请: { 
          id: conflict.id,
          title: conflict.title, 
          start: conflict.start_time, 
          end: conflict.end_time 
        }
      });
      return res.status(409).json({ 
        message: '该时间段会议室已被占用',
        conflict: {
          title: conflict.title,
          start_time: conflict.start_time,
          end_time: conflict.end_time
        }
      });
    }

    const application = await MeetingApplication.create({
      applicant_id: req.user.id,
      department_id: req.user.department_id,
      room_id,
      title,
      description,
      start_time: startDate,
      end_time: endDate,
      status: 'pending'
    });

    // 根据审批流模板自动生成审批步骤
    const ApprovalTemplate = require('../models/ApprovalTemplate');
    const ApprovalTemplateStep = require('../models/ApprovalTemplateStep');
    // 这里默认用第一个启用的模板，可根据业务调整
    const template = await ApprovalTemplate.findOne({ where: { enabled: true } });
    if (template) {
      const steps = await ApprovalTemplateStep.findAll({ where: { template_id: template.id }, order: [['step_order', 'ASC']] });
      for (const s of steps) {
        // 根据role_code查找对应角色的用户
        let leader = null;
        try {
          // 根据role_code匹配角色名称
          let roleName;
          switch(s.role_code) {
            case 'DEPT_LEADER':
              roleName = '部门领导';
              break;
            case 'SUPERVISOR':
              roleName = '主管';
              break;
            case 'COMMAND_LEADER':
              roleName = '指挥中心领导';
              break;
            default:
              roleName = s.role_code;
          }
          
          // 查找该部门下拥有指定角色的用户
          const users = await User.findAll({
            where: { 
              department_id: s.department_id,
              status: 1
            },
            include: [{
              model: require('../models/Role'),
              where: { name: roleName },
              required: true,
              through: { attributes: [] }
            }]
          });
          
          leader = users.length > 0 ? users[0] : null;
        } catch (e) {
          console.error('查找审批人出错', e);
        }
        await ApprovalStep.create({
          application_id: application.id,
          step_order: s.step_order,
          step_name: s.step_name || `第${s.step_order}步审批`,
          department_id: s.department_id,
          approver_id: leader ? leader.id : null,
          approver_type: 'user',
          status: leader ? (s.step_order === 1 ? 'pending' : 'skipped') : 'no_leader'
        });
        // 自动补充审批模板和用户（如缺失）
        if (!leader) {
          // 检查并插入用户（仅开发环境建议，生产请用后台管理）
          try {
            const dept = await Department.findByPk(s.department_id);
            if (dept) {
              const roleName = s.role_code === 'DEPT_LEADER' ? '部门领导' : 
                              s.role_code === 'SUPERVISOR' ? '主管' : 
                              s.role_code === 'COMMAND_LEADER' ? '指挥中心领导' : s.role_code;
              const username = `auto_${dept.id}_${s.role_code}`;
              const real_name = `${dept.name}-${roleName}`;
              const exist = await User.findOne({ where: { department_id: dept.id, real_name } });
              if (!exist) {
                await User.create({ username, real_name, department_id: dept.id });
                console.log(`已自动插入用户: ${real_name}`);
              }
            }
          } catch (e) {
            console.error('自动插入审批人失败', e);
          }
        }
      }
    }
    res.json({ message: '申请成功', application });
  } catch (err) {
    console.error('会议申请出错', err);
    res.status(500).json({ message: '申请失败', error: err.message, stack: err.stack });
  }
});

// 获取某申请的审批流进度
router.get('/:id/approval', auth, async (req, res) => {
  try {
    const steps = await ApprovalStep.findAll({
      where: { application_id: req.params.id },
      include: [
        { model: Department, attributes: ['name'] },
        { model: User, as: 'leader', attributes: ['real_name'] }
      ],
      order: [['step_order', 'ASC']]
    });
    res.json(steps);
  } catch (err) {
    res.status(500).json({ message: '获取审批流失败', error: err.message });
  }
});

// 审批操作（通过/拒绝）
router.post('/:id/approval', auth, async (req, res) => {
  try {
    const { step_id, action, comment } = req.body; // action: approve/reject
    const step = await ApprovalStep.findOne({ where: { id: step_id, application_id: req.params.id } });
    if (!step) return res.status(404).json({ message: '审批步骤不存在' });
    if (step.status !== 'pending') return res.status(400).json({ message: '该步骤已处理' });
    if (action === 'approve') {
      step.status = 'approved';
    } else if (action === 'reject') {
      step.status = 'rejected';
      // 同步更新主申请状态为rejected
      await MeetingApplication.update({ status: 'rejected' }, { where: { id: req.params.id } });
    }
    step.comment = comment;
    step.updated_at = new Date();
    await step.save();
    // 如果所有步骤都通过，则主申请状态设为approved
    const allSteps = await ApprovalStep.findAll({ where: { application_id: req.params.id } });
    if (allSteps.every(s => s.status === 'approved')) {
      await MeetingApplication.update({ status: 'approved' }, { where: { id: req.params.id } });
    }
    res.json({ message: '审批操作成功' });
  } catch (err) {
    res.status(500).json({ message: '审批操作失败', error: err.message });
  }
});

// 获取单个申请详情
router.get('/:id', auth, async (req, res) => {
  try {
    const applicationId = parseInt(req.params.id);
    console.log('查询申请详情，申请ID:', applicationId, '用户ID:', req.user.id);
    
    const application = await MeetingApplication.findByPk(applicationId);
    
    if (!application) {
      return res.status(404).json({ message: '申请不存在' });
    }
    
    // 获取关联数据
    const applicant = await User.findByPk(application.applicant_id);
    const department = await Department.findByPk(application.department_id);
    const meetingRoom = await MeetingRoom.findByPk(application.room_id);
    
    // 获取审批步骤
    const approvalSteps = await ApprovalStep.findAll({
      where: { application_id: applicationId },
      order: [['step_order', 'ASC']]
    });
    
    // 为每个审批步骤获取审批人信息
    const stepsWithApprovers = [];
    for (const step of approvalSteps) {
      const approver = step.approver_id ? await User.findByPk(step.approver_id) : null;
      const stepDepartment = step.department_id ? await Department.findByPk(step.department_id) : null;
      
      stepsWithApprovers.push({
        id: step.id,
        step_order: step.step_order,
        step_name: step.step_name,
        status: step.status,
        comment: step.comment,
        approval_time: step.approval_time,
        approver: approver ? {
          id: approver.id,
          real_name: approver.real_name,
          username: approver.username
        } : null,
        department: stepDepartment ? {
          name: stepDepartment.name
        } : null
      });
    }
    
    const result = {
      id: application.id,
      application_no: application.application_no,
      title: application.title,
      description: application.description,
      meeting_type: application.meeting_type,
      start_time: application.start_time,
      end_time: application.end_time,
      attendee_count: application.attendee_count,
      contact_person: application.contact_person,
      contact_phone: application.contact_phone,
      special_requirements: application.special_requirements,
      status: application.status,
      urgency_level: application.urgency_level,
      current_step: application.current_step,
      created_at: application.created_at,
      updated_at: application.updated_at,
      applicant: applicant ? {
        id: applicant.id,
        real_name: applicant.real_name,
        username: applicant.username
      } : null,
      department: department ? {
        name: department.name
      } : null,
      meeting_room: meetingRoom ? {
        id: meetingRoom.id,
        name: meetingRoom.name,
        location: meetingRoom.location,
        capacity: meetingRoom.capacity
      } : null,
      approval_steps: stepsWithApprovers
    };
    
    console.log('申请详情查询成功，返回数据包含', stepsWithApprovers.length, '个审批步骤');
    res.json(result);
  } catch (err) {
    console.error('获取申请详情失败:', err);
    res.status(500).json({ message: '获取申请详情失败', error: err.message });
  }
});

// 临时测试接口 - 创建会议申请（无需认证）
router.post('/test', async (req, res) => {
  try {
    const { title, room_id, start_time, end_time, description } = req.body;
    console.log('收到测试申请:', req.body);
    
    if (!title || !room_id || !start_time || !end_time) {
      return res.status(400).json({ message: '参数不完整' });
    }
    
    // 使用固定用户ID (用户1) 进行测试
    const testUserId = 1;
    const testUser = await User.findByPk(testUserId);
    if (!testUser) {
      return res.status(400).json({ message: '测试用户不存在' });
    }
    
    // 转为北京时间
    function toBeijingDate(str) {
      if (!str) return null;
      
      let date;
      if (typeof str === 'string') {
        // 处理不同格式的字符串
        if (str.includes('T')) {
          // ISO格式：2025-07-09T09:00:00 或 2025-07-09T09:00:00Z
          if (str.endsWith('Z')) {
            date = new Date(str);
          } else {
            date = new Date(str + '+08:00');
          }
        } else {
          // 标准格式：2025-07-09 09:00:00
          date = new Date(str.replace(' ', 'T') + '+08:00');
        }
      } else if (str instanceof Date) {
        date = str;
      } else {
        date = new Date(str);
      }
      
      // 确保时间有效
      if (isNaN(date.getTime())) {
        return null;
      }
      
      return date;
    }

    const startDate = toBeijingDate(start_time);
    const endDate = toBeijingDate(end_time);
    if (!startDate || !endDate || isNaN(startDate) || isNaN(endDate)) {
      return res.status(400).json({ message: '时间格式错误' });
    }

    // 检查会议室是否有冲突（测试接口也需要冲突检测）
    const conflict = await MeetingApplication.findOne({
      where: {
        room_id,
        status: { [Op.in]: ['pending', 'approved'] },
        [Op.and]: [
          { start_time: { [Op.lt]: endDate } },     // 现有开始时间 < 新结束时间
          { end_time: { [Op.gt]: startDate } }      // 现有结束时间 > 新开始时间
        ]
      }
    });
    
    if (conflict) {
      console.log('测试接口发现时间冲突:', {
        新申请: { start: startDate, end: endDate },
        冲突申请: { 
          id: conflict.id,
          title: conflict.title, 
          start: conflict.start_time,  
          end: conflict.end_time 
        }
      });
      return res.status(409).json({ 
        success: false,
        message: '该时间段会议室已被占用',
        conflict: {
          title: conflict.title,
          start_time: conflict.start_time,
          end_time: conflict.end_time
        }
      });
    }

    const application = await MeetingApplication.create({
      applicant_id: testUserId,
      department_id: testUser.department_id,
      room_id,
      title,
      description,
      start_time: startDate,
      end_time: endDate,
      status: 'pending'
    });

    console.log('创建的申请:', application.toJSON());
    res.json({ 
      success: true,
      message: '测试申请成功', 
      application: application.toJSON(),
      id: application.id,
      application_id: application.id
    });
  } catch (err) {
    console.error('测试会议申请出错', err);
    res.status(500).json({ message: '申请失败', error: err.message });
  }
});

// 测试接口 - 获取所有申请记录（无需认证）
router.get('/all-test', async (req, res) => {
  try {
    console.log('获取所有申请记录...');
    const list = await MeetingApplication.findAll({
      include: [
        { model: User, as: 'applicant', attributes: ['real_name'] },
        { model: Department, as: 'applicantDepartment', attributes: ['name'] },
        { model: MeetingRoom, as: 'meetingRoom', attributes: ['name', 'location'] }
      ],
      order: [['created_at', 'DESC']],
      limit: 100 // 增加限制，获取更多数据供日历显示
    });
    console.log(`找到${list.length}条申请记录`);
    res.json({
      success: true,
      count: list.length,
      data: list
    });
  } catch (err) {
    console.error('获取申请记录失败:', err);
    res.status(500).json({ message: '获取申请记录失败', error: err.message });
  }
});

// 测试接口 - 获取指定用户的申请记录（无需认证）
router.get('/mine-test/:user_id?', async (req, res) => {
  try {
    const userId = req.params.user_id || 1; // 默认用户ID为1
    console.log(`获取用户${userId}的申请记录...`);
    
    const list = await MeetingApplication.findAll({
      where: { applicant_id: userId },
      include: [
        { model: User, as: 'applicant', attributes: ['real_name'] },
        { model: Department, as: 'applicantDepartment', attributes: ['name'] },
        { model: MeetingRoom, as: 'meetingRoom', attributes: ['name', 'location'] }
      ],
      order: [['created_at', 'DESC']]
    });
    
    console.log(`用户${userId}有${list.length}条申请记录`);
    res.json({
      success: true,
      user_id: userId,
      count: list.length,
      data: list
    });
  } catch (err) {
    console.error('获取用户申请记录失败:', err);
    res.status(500).json({ message: '获取申请记录失败', error: err.message });
  }
});

// 测试接口：获取所有审批步骤（开发用）
router.get('/test/approval-steps', async (req, res) => {
  try {
    const steps = await ApprovalStep.findAll({
      include: [
        {
          model: MeetingApplication,
          as: 'application',
          attributes: ['id', 'application_no', 'title', 'status'],
          include: [
            { model: User, as: 'applicant', attributes: ['real_name'] }
          ]
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'real_name', 'username'],
          required: false
        },
        {
          model: Department,
          as: 'department',
          attributes: ['name'],
          required: false
        }
      ],
      order: [['application_id', 'ASC'], ['step_order', 'ASC']]
    });

    const result = steps.map(step => ({
      id: step.id,
      application_id: step.application_id,
      application_no: step.application?.application_no,
      title: step.application?.title,
      applicant: step.application?.applicant?.real_name,
      step_order: step.step_order,
      step_name: step.step_name,
      department: step.department?.name,
      approver: step.approver ? {
        id: step.approver.id,
        name: step.approver.real_name,
        username: step.approver.username
      } : null,
      status: step.status,
      created_at: step.created_at
    }));

    res.json({
      message: '审批步骤列表',
      total: result.length,
      data: result
    });
  } catch (err) {
    console.error('获取审批步骤失败:', err);
    res.status(500).json({ message: '获取审批步骤失败', error: err.message });
  }
});

// 临时数据修复接口
router.post('/fix-approval-flow', async (req, res) => {
  try {
    // 修复审批流：只有第一步应该是pending，其他步骤应该是waiting
    const { QueryTypes } = require('sequelize');
    const sequelize = require('../config/db');
    
    // 1. 将所有非第一步的pending状态改为skipped（表示等待中）
    await sequelize.query(`
      UPDATE approval_steps 
      SET status = 'skipped' 
      WHERE step_order > 1 
      AND status = 'pending' 
      AND application_id IN (
        SELECT id FROM meeting_applications WHERE status = 'pending'
      )
    `, { type: QueryTypes.UPDATE });
    
    // 2. 对于已审批的步骤，激活下一步
    const approvedSteps = await sequelize.query(`
      SELECT DISTINCT application_id, MAX(step_order) as last_approved_step
      FROM approval_steps 
      WHERE status = 'approved'
      GROUP BY application_id
    `, { type: QueryTypes.SELECT });
    
    for (const row of approvedSteps) {
      await sequelize.query(`
        UPDATE approval_steps 
        SET status = 'pending' 
        WHERE application_id = ? 
        AND step_order = ? 
        AND status = 'skipped'
      `, { 
        replacements: [row.application_id, row.last_approved_step + 1],
        type: QueryTypes.UPDATE 
      });
    }
    
    res.json({ 
      message: '审批流数据修复完成',
      fixedApprovedSteps: approvedSteps.length
    });
  } catch (err) {
    console.error('修复审批流数据失败:', err);
    res.status(500).json({ message: '修复失败', error: err.message });
  }
});

// 临时接口：更新申请状态（测试用）
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const applicationId = parseInt(req.params.id);
    
    await MeetingApplication.update(
      { status },
      { where: { id: applicationId } }
    );
    
    res.json({ 
      message: '状态更新成功',
      applicationId,
      newStatus: status
    });
  } catch (err) {
    console.error('更新申请状态失败:', err);
    res.status(500).json({ message: '更新状态失败', error: err.message });
  }
});

module.exports = router;

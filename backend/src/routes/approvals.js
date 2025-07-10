const express = require('express');
const router = express.Router();
// 使用统一的模型导入，确保关联关系已设置
const models = require('../models');
const ApprovalStep = models.ApprovalStep;
const MeetingApplication = models.MeetingApplication;
const MeetingRoom = models.MeetingRoom;
const User = models.User;
const Department = models.Department;
const auth = require('../middlewares/auth');

const ApprovalTemplate = models.ApprovalTemplate;
const ApprovalTemplateStep = models.ApprovalTemplateStep;
const ApprovalRecord = models.ApprovalRecord;
const CCRecord = models.CCRecord;
const { Op } = require('sequelize');

// 获取当前用户的待审批事项
router.get('/mine', auth, async (req, res) => {
  try {
    // 查找当前用户的审批任务
    const steps = await ApprovalStep.findAll({
      where: { 
        approver_id: req.user.id, 
        status: 'pending' 
      },
      order: [['created_at', 'DESC']]
    });

    // 手动获取关联数据
    const result = [];
    for (const step of steps) {
      try {
        const application = await MeetingApplication.findByPk(step.application_id);
        if (application) {
          const applicant = await User.findByPk(application.applicant_id);
          const department = await Department.findByPk(application.department_id);
          const meetingRoom = await MeetingRoom.findByPk(application.room_id);

          result.push({
            id: step.id,
            application_id: step.application_id,
            step_order: step.step_order,
            step_name: step.step_name,
            status: step.status,
            timeout_at: step.timeout_at,
            created_at: step.created_at,
            application: {
              id: application.id,
              application_no: application.application_no,
              title: application.title,
              description: application.description,
              start_time: application.start_time,
              end_time: application.end_time,
              attendee_count: application.attendee_count,
              status: application.status,
              urgency_level: application.urgency_level,
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
            }
          });
        }
      } catch (err) {
        console.error('处理审批步骤数据出错:', err);
      }
    }

    res.json(result);
  } catch (err) {
    console.error('获取待审批失败:', err);
    res.status(500).json({ message: '获取待审批失败', error: err.message });
  }
});

// 审批操作（同意/拒绝）
router.post('/action', auth, async (req, res) => {
  /*
    body: { step_id, action, comment }
    action: 'approved' | 'rejected'
  */
  const { step_id, action, comment } = req.body;
  if (!['approved', 'rejected'].includes(action)) {
    return res.status(400).json({ message: '无效操作' });
  }
  
  try {
    const step = await ApprovalStep.findByPk(step_id);
    
    if (!step) {
      return res.status(404).json({ message: '审批步骤不存在' });
    }
    
    // 检查是否是分配给当前用户的审批任务
    if (step.approver_id !== req.user.id) {
      return res.status(403).json({ message: '无权限操作此审批任务' });
    }
    
    if (step.status !== 'pending') {
      return res.status(400).json({ message: '该审批已处理' });
    }
    
    // 更新审批步骤
    step.status = action;
    step.comment = comment || '';
    step.approval_time = new Date();
    step.operator_id = req.user.id;
    await step.save();
    
    // 记录审批操作
    const recordAction = action === 'approved' ? 'approve' : 'reject';
    await ApprovalRecord.create({
      application_id: step.application_id,
      step_id: step.id,
      approver_id: req.user.id,
      action: recordAction,
      comment: comment || ''
    });
    
    // 处理审批流程
    if (action === 'approved') {
      // 查找下一步审批
      const nextStep = await ApprovalStep.findOne({
        where: {
          application_id: step.application_id,
          step_order: step.step_order + 1
        }
      });
      
      if (!nextStep) {
        // 没有下一步，申请通过
        await MeetingApplication.update(
          { status: 'approved', current_step: step.step_order + 1 }, 
          { where: { id: step.application_id } }
        );
      } else {
        // 激活下一步审批
        if (nextStep.status === 'skipped') {
          nextStep.status = 'pending';
          await nextStep.save();
        }
        // 更新当前步骤
        await MeetingApplication.update(
          { current_step: nextStep.step_order }, 
          { where: { id: step.application_id } }
        );
      }
    } else {
      // 拒绝则终止申请
      await MeetingApplication.update(
        { status: 'rejected' }, 
        { where: { id: step.application_id } }
      );
    }
    
    res.json({ message: '操作成功', action, step_name: step.step_name });
  } catch (err) {
    console.error('审批操作失败:', err);
    res.status(500).json({ message: '审批操作失败', error: err.message });
  }
});

// 查询某个申请的审批进度与历史
router.get('/progress/:application_id', auth, async (req, res) => {
  try {
    const steps = await ApprovalStep.findAll({
      where: { application_id: req.params.application_id },
      include: [
        { model: Department, attributes: ['name'] },
        { model: User, as: 'leader', attributes: ['real_name'] }
      ],
      order: [['step_order', 'ASC']]
    });
    const records = await ApprovalRecord.findAll({
      where: { flow_id: req.params.application_id },
      include: [{ model: User, attributes: ['real_name'] }],
      order: [['created_at', 'ASC']]
    });
    res.json({ steps, records });
  } catch (err) {
    res.status(500).json({ message: '获取审批进度失败', error: err.message });
  }
});

// 抄送相关用户（如科技组、保障室）
router.post('/cc', auth, async (req, res) => {
  /* body: { application_id, cc_user_ids: [int] } */
  const { application_id, cc_user_ids } = req.body;
  if (!Array.isArray(cc_user_ids) || !application_id) {
    return res.status(400).json({ message: '参数错误' });
  }
  try {
    const records = await Promise.all(cc_user_ids.map(uid =>
      CCRecord.create({ application_id, cc_user_id: uid })
    ));
    res.json({ message: '抄送成功', records });
  } catch (err) {
    res.status(500).json({ message: '抄送失败', error: err.message });
  }
});

// 发起审批流（会议申请时调用）
// 支持自定义审批人
router.post('/start', auth, async (req, res) => {
  /* body: { application_id, template_id, steps: [{step_order, leader_id}] } */
  const { application_id, template_id, steps: customSteps } = req.body;
  if (!application_id || !template_id || !Array.isArray(customSteps) || customSteps.length === 0) {
    return res.status(400).json({ message: '参数错误，必须指定每一步的审批人' });
  }
  try {
    // 查询模板步骤
    const templateSteps = await ApprovalTemplateStep.findAll({
      where: { template_id },
      order: [['step_order', 'ASC']]
    });
    // 校验每一步都指定了审批人
    for (const ts of templateSteps) {
      const found = customSteps.find(s => s.step_order === ts.step_order && s.leader_id);
      if (!found) {
        return res.status(400).json({ message: `第${ts.step_order}步未指定审批人` });
      }
    }
    // 依次创建审批步骤
    const steps = await Promise.all(templateSteps.map(ts => {
      const found = customSteps.find(s => s.step_order === ts.step_order);
      return ApprovalStep.create({
        application_id,
        step_order: ts.step_order,
        department_id: ts.department_id,
        leader_id: found.leader_id,
        status: ts.step_order === 1 ? 'pending' : 'waiting'
      });
    }));
    res.json({ message: '审批流已创建', steps });
  } catch (err) {
    res.status(500).json({ message: '审批流创建失败', error: err.message });
  }
});

// 获取审批模板的步骤和候选人（审批人）
router.get('/template-steps/:template_id', auth, async (req, res) => {
  try {
    const template_id = req.params.template_id;
    
    // 查询模板步骤
    const steps = await ApprovalTemplateStep.findAll({
      where: { template_id },
      order: [['step_order', 'ASC']]
    });
    
    if (steps.length === 0) {
      return res.json({ steps: [] });
    }
    
    const result = [];
    
    for (const step of steps) {
      console.log(`步骤${step.step_order}：部门ID=${step.department_id}，角色代码=${step.role_code}`);
      
      try {
        // 根据role_code匹配角色名称
        let roleName;
        switch(step.role_code) {
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
            roleName = step.role_code;
        }
        
        // 查找该部门下拥有指定角色的用户
        const users = await User.findAll({
          where: { 
            department_id: step.department_id,
            status: 1 // 只查询启用的用户
          },
          attributes: ['id', 'real_name', 'department_id'],
          include: [{
            model: require('../models/Role'),
            where: { name: roleName },
            required: true,
            through: { attributes: [] },
            attributes: ['name']
          }]
        });
        
        console.log(`  查到候选人数量: ${users.length}`);
        
        if (users.length === 0) {
          // 调试：查看该部门下所有用户和角色
          const allUsers = await User.findAll({
            where: { department_id: step.department_id },
            attributes: ['id', 'real_name'],
            include: [{
              model: require('../models/Role'),
              through: { attributes: [] },
              attributes: ['name'],
              required: false
            }]
          });
          console.log(`  该部门下所有用户及其角色:`, 
            allUsers.map(u => ({ 
              id: u.id, 
              name: u.real_name, 
              roles: u.roles?.map(r => r.name) || []
            }))
          );
        }
        
        // 获取部门信息
        const department = await Department.findByPk(step.department_id);
        
        result.push({
          step_order: step.step_order,
          step_name: step.step_name,
          dept_name: department?.name || `部门${step.department_id}`,
          department_id: step.department_id,
          leader_role: roleName, // 使用转换后的角色名称
          role_code: step.role_code,
          allow_custom_approver: step.allow_custom_approver || 0,
          candidates: users.map(user => ({
            id: user.id,
            real_name: user.real_name,
            department_id: user.department_id,
            department_name: department?.name
          }))
        });
        
      } catch (stepError) {
        console.error(`处理步骤${step.step_order}时出错:`, stepError);
        // 即使某个步骤出错，也要继续处理其他步骤
        const department = await Department.findByPk(step.department_id);
        result.push({
          step_order: step.step_order,
          step_name: step.step_name,
          dept_name: department?.name || `部门${step.department_id}`,
          department_id: step.department_id,
          leader_role: step.role_code, // 显示原始角色代码
          role_code: step.role_code,
          allow_custom_approver: step.allow_custom_approver || 0,
          candidates: []
        });
      }
    }
    
    res.json({ steps: result });
    
  } catch (err) {
    console.error('获取审批模板步骤失败', err);
    res.status(500).json({ 
      message: '获取审批模板步骤失败', 
      error: err.message,
      steps: []
    });
  }
});

// 获取审批模板列表
router.get('/templates', auth, async (req, res) => {
  try {
    console.log('开始查询审批模板...');
    const templates = await ApprovalTemplate.findAll({
      where: { enabled: 1 },
      attributes: ['id', 'name', 'description'],
      order: [['id', 'ASC']]
    });
    console.log('查询到的模板数据:', templates.length, '条');
    console.log('模板详情:', JSON.stringify(templates, null, 2));
    res.json(templates);
  } catch (err) {
    console.error('获取审批模板失败', err);
    res.status(500).json({ message: '获取审批模板失败', error: err.message });
  }
});

// 测试接口 - 获取审批模板（无需认证）
router.get('/templates/test', async (req, res) => {
  try {
    const templates = await ApprovalTemplate.findAll({
      attributes: ['id', 'name', 'description', 'enabled', 'is_default'],
      order: [['is_default', 'DESC'], ['id', 'ASC']]
    });
    console.log('查询到的模板数据:', templates);
    res.json({
      success: true,
      count: templates.length,
      data: templates
    });
  } catch (err) {
    console.error('测试获取审批模板失败', err);
    res.status(500).json({ 
      success: false,
      message: '获取审批模板失败', 
      error: err.message 
    });
  }
});

// 临时测试接口 - 获取审批模板步骤（无需认证）
router.get('/template-steps-test/:template_id', async (req, res) => {
  try {
    const template_id = req.params.template_id;
    
    // 查询模板步骤
    const steps = await ApprovalTemplateStep.findAll({
      where: { template_id },
      order: [['step_order', 'ASC']]
    });
    
    if (steps.length === 0) {
      return res.json({ steps: [] });
    }
    
    const result = [];
    
    for (const step of steps) {
      console.log(`步骤${step.step_order}：部门ID=${step.department_id}，角色代码=${step.role_code}`);
      
      try {
        // 根据role_code匹配角色名称
        let roleName;
        switch(step.role_code) {
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
            roleName = step.role_code;
        }
        
        // 查找该部门下拥有指定角色的用户
        const users = await User.findAll({
          where: { 
            department_id: step.department_id,
            status: 1 // 只查询启用的用户
          },
          attributes: ['id', 'real_name', 'department_id'],
          include: [{
            model: require('../models/Role'),
            where: { name: roleName },
            required: true,
            through: { attributes: [] },
            attributes: ['name']
          }]
        });
        
        console.log(`  查到候选人数量: ${users.length}`);
        
        // 获取部门信息
        const department = await Department.findByPk(step.department_id);
        
        result.push({
          step_order: step.step_order,
          step_name: step.step_name,
          dept_name: department?.name || `部门${step.department_id}`,
          department_id: step.department_id,
          leader_role: roleName, // 使用转换后的角色名称
          role_code: step.role_code,
          allow_custom_approver: step.allow_custom_approver || 0,
          candidates: users.map(user => ({
            id: user.id,
            real_name: user.real_name,
            department_id: user.department_id,
            department_name: department?.name
          }))
        });
        
      } catch (stepError) {
        console.error(`处理步骤${step.step_order}时出错:`, stepError);
        const department = await Department.findByPk(step.department_id);
        result.push({
          step_order: step.step_order,
          step_name: step.step_name,
          dept_name: department?.name || `部门${step.department_id}`,
          department_id: step.department_id,
          leader_role: step.role_code,
          role_code: step.role_code,
          allow_custom_approver: step.allow_custom_approver || 0,
          candidates: []
        });
      }
    }
    
    res.json({ 
      success: true,
      template_id: template_id,
      steps: result 
    });
    
  } catch (err) {
    console.error('获取审批模板步骤失败', err);
    res.status(500).json({ 
      success: false,
      message: '获取审批模板步骤失败', 
      error: err.message,
      steps: []
    });
  }
});

// 获取用户的审批历史
router.get('/history', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: steps } = await ApprovalStep.findAndCountAll({
      where: { 
        approver_id: req.user.id,
        status: { [Op.in]: ['approved', 'rejected'] }
      },
      include: [
        { 
          model: MeetingApplication, 
          as: 'application',
          include: [
            { model: User, as: 'applicant', attributes: ['real_name', 'username'] },
            { model: Department, as: 'applicantDepartment', attributes: ['name'] },
            { model: MeetingRoom, as: 'meetingRoom', attributes: ['name', 'location'] }
          ] 
        }
      ],
      order: [['approval_time', 'DESC']],
      limit,
      offset
    });

    const result = {
      total: count,
      page,
      pages: Math.ceil(count / limit),
      data: steps.map(step => ({
        id: step.id,
        application_id: step.application_id,
        step_order: step.step_order,
        step_name: step.step_name,
        status: step.status,
        comment: step.comment,
        approval_time: step.approval_time,
        application: {
          id: step.application.id,
          application_no: step.application.application_no,
          title: step.application.title,
          start_time: step.application.start_time,
          end_time: step.application.end_time,
          status: step.application.status,
          applicant: step.application.applicant,
          department: step.application.applicantDepartment,
          meeting_room: step.application.meetingRoom
        }
      }))
    };

    res.json(result);
  } catch (err) {
    console.error('获取审批历史失败:', err);
    res.status(500).json({ message: '获取审批历史失败', error: err.message });
  }
});

// 测试接口：按用户查看审批任务（开发用）
router.get('/test/by-user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    const steps = await ApprovalStep.findAll({
      where: { approver_id: userId },
      order: [['created_at', 'DESC']]
    });

    // 手动获取关联数据
    const result = [];
    for (const step of steps) {
      try {
        const application = await MeetingApplication.findByPk(step.application_id);
        if (application) {
          const applicant = await User.findByPk(application.applicant_id);
          const department = await Department.findByPk(application.department_id);
          const meetingRoom = await MeetingRoom.findByPk(application.room_id);

          result.push({
            id: step.id,
            application_id: step.application_id,
            step_order: step.step_order,
            step_name: step.step_name,
            status: step.status,
            approval_time: step.approval_time,
            comment: step.comment,
            application: {
              id: application.id,
              application_no: application.application_no,
              title: application.title,
              start_time: application.start_time,
              end_time: application.end_time,
              status: application.status,
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
            }
          });
        }
      } catch (err) {
        console.error('处理步骤数据出错:', err);
      }
    }

    res.json({
      message: `用户${userId}的审批任务`,
      user_id: userId,
      total: result.length,
      pending: result.filter(r => r.status === 'pending').length,
      processed: result.filter(r => r.status !== 'pending').length,
      data: result
    });
  } catch (err) {
    console.error('获取用户审批任务失败:', err);
    res.status(500).json({ message: '获取用户审批任务失败', error: err.message });
  }
});

module.exports = router;

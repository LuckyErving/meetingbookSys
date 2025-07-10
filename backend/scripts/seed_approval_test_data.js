// 自动生成审批流测试数据脚本
// 用法：node scripts/seed_approval_test_data.js

const sequelize  = require('../src/config/db');
const Department = require('../src/models/Department');
const Role = require('../src/models/Role');
const User = require('../src/models/User');
const UserRole = require('../src/models/UserRole');
const ApprovalTemplate = require('../src/models/ApprovalTemplate');
const ApprovalTemplateStep = require('../src/models/ApprovalTemplateStep');

async function seed() {
  await sequelize.sync();
  // 1. 部门
  const [dept1, dept2] = await Promise.all([
    Department.findOrCreate({ where: { name: '行政部' }, defaults: { description: '行政部' } }),
    Department.findOrCreate({ where: { name: '指挥中心' }, defaults: { description: '指挥中心' } })
  ]);
  // 2. 角色
  const [role1, role2] = await Promise.all([
    Role.findOrCreate({ where: { name: '部门领导' }, defaults: { description: '部门领导' } }),
    Role.findOrCreate({ where: { name: '指挥中心领导' }, defaults: { description: '指挥中心领导' } })
  ]);
  // 3. 用户
  const [user1, user2, user3, user4] = await Promise.all([
    User.findOrCreate({ where: { username: 'zhangsan' }, defaults: { real_name: '张三', password: '123456', department_id: dept1[0].id } }),
    User.findOrCreate({ where: { username: 'lisi' }, defaults: { real_name: '李四', password: '123456', department_id: dept1[0].id } }),
    User.findOrCreate({ where: { username: 'wangwu' }, defaults: { real_name: '王五', password: '123456', department_id: dept2[0].id } }),
    User.findOrCreate({ where: { username: 'zhaoliu' }, defaults: { real_name: '赵六', password: '123456', department_id: dept2[0].id } })
  ]);
  // 4. 用户角色关系
  await Promise.all([
    UserRole.findOrCreate({ where: { user_id: user1[0].id, role_id: role1[0].id } }), // 张三-部门领导
    UserRole.findOrCreate({ where: { user_id: user2[0].id, role_id: role1[0].id } }), // 李四-部门领导
    UserRole.findOrCreate({ where: { user_id: user3[0].id, role_id: role2[0].id } }), // 王五-指挥中心领导
    UserRole.findOrCreate({ where: { user_id: user4[0].id, role_id: role2[0].id } })  // 赵六-指挥中心领导
  ]);
  // 5. 审批模板
  const [template] = await ApprovalTemplate.findOrCreate({
    where: { name: '会议申请标准流程' },
    defaults: { description: '标准会议申请审批流程' }
  });
  // 6. 审批模板步骤（部门领导->指挥中心领导）
  await ApprovalTemplateStep.findOrCreate({
    where: { template_id: template.id, step_order: 1 },
    defaults: {
      template_id: template.id,
      step_order: 1,
      department_id: dept1[0].id,
      leader_role: '部门领导'
    }
  });
  await ApprovalTemplateStep.findOrCreate({
    where: { template_id: template.id, step_order: 2 },
    defaults: {
      template_id: template.id,
      step_order: 2,
      department_id: dept2[0].id,
      leader_role: '指挥中心领导'
    }
  });
  console.log('审批流测试数据已生成');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });

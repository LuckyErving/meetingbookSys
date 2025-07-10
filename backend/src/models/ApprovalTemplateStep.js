const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const ApprovalTemplate = require('./ApprovalTemplate');
const Department = require('./Department');

const ApprovalTemplateStep = sequelize.define('approval_template_steps', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  template_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: ApprovalTemplate, key: 'id' } },
  step_order: { type: DataTypes.INTEGER, allowNull: false },
  step_name: { type: DataTypes.STRING(100), allowNull: false },
  department_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: Department, key: 'id' } },
  role_code: { type: DataTypes.STRING(50), allowNull: true },
  approver_type: { type: DataTypes.ENUM('role','user','dept_leader','custom'), defaultValue: 'role' },
  specific_user_ids: { type: DataTypes.JSON, allowNull: true },
  is_required: { type: DataTypes.BOOLEAN, defaultValue: true },
  allow_custom_approver: { type: DataTypes.BOOLEAN, defaultValue: false },
  parallel_approval: { type: DataTypes.BOOLEAN, defaultValue: false },
  auto_approve_rules: { type: DataTypes.JSON, allowNull: true },
  timeout_hours: { type: DataTypes.INTEGER, defaultValue: 72 },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  timestamps: false
});

ApprovalTemplateStep.belongsTo(ApprovalTemplate, { foreignKey: 'template_id' });
ApprovalTemplateStep.belongsTo(Department, { foreignKey: 'department_id' });

module.exports = ApprovalTemplateStep;

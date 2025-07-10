const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ApprovalStep = sequelize.define('approval_steps', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  application_id: { type: DataTypes.INTEGER, allowNull: false },
  step_order: { type: DataTypes.INTEGER, allowNull: false },
  step_name: { type: DataTypes.STRING(100), allowNull: false },
  department_id: { type: DataTypes.INTEGER },
  approver_id: { type: DataTypes.INTEGER },
  approver_type: { type: DataTypes.ENUM('role','user','auto'), defaultValue: 'user' },
  status: { type: DataTypes.ENUM('pending','approved','rejected','skipped','timeout','waiting'), defaultValue: 'pending' },
  comment: { type: DataTypes.TEXT },
  approval_time: { type: DataTypes.DATE },
  timeout_at: { type: DataTypes.DATE },
  operator_id: { type: DataTypes.INTEGER },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  timestamps: false
});

// 定义关联
ApprovalStep.associate = function(models) {
  ApprovalStep.belongsTo(models.MeetingApplication, { 
    foreignKey: 'application_id',
    as: 'application'
  });
  ApprovalStep.belongsTo(models.Department, { 
    foreignKey: 'department_id',
    as: 'department'
  });
  ApprovalStep.belongsTo(models.User, { 
    foreignKey: 'approver_id',
    as: 'approver'
  });
  ApprovalStep.belongsTo(models.User, { 
    foreignKey: 'operator_id',
    as: 'operator'
  });
};

module.exports = ApprovalStep;

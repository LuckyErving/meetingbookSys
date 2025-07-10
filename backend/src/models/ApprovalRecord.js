const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ApprovalRecord = sequelize.define('approval_records', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  application_id: { type: DataTypes.INTEGER, allowNull: false },
  step_id: { type: DataTypes.INTEGER, allowNull: false },
  approver_id: { type: DataTypes.INTEGER, allowNull: false },
  action: { type: DataTypes.ENUM('submit','approve','reject','transfer','withdraw'), allowNull: false },
  comment: { type: DataTypes.TEXT },
  attachments: { type: DataTypes.JSON },
  ip_address: { type: DataTypes.STRING(45) },
  user_agent: { type: DataTypes.STRING(500) },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  timestamps: false
});

module.exports = ApprovalRecord;

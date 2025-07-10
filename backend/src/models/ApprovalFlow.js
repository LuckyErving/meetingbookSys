const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const MeetingApplication = require('./MeetingApplication');
const User = require('./User');

const ApprovalFlow = sequelize.define('approval_flows', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  application_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: MeetingApplication, key: 'id' } },
  step: { type: DataTypes.INTEGER, allowNull: false },
  approver_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: 'id' } },
  status: { type: DataTypes.ENUM('pending','approved','rejected'), defaultValue: 'pending' },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  timestamps: false
});

ApprovalFlow.belongsTo(MeetingApplication, { foreignKey: 'application_id' });
ApprovalFlow.belongsTo(User, { foreignKey: 'approver_id' });

module.exports = ApprovalFlow;

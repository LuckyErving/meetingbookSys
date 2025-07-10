const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ApprovalTemplate = sequelize.define('approval_templates', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  code: { type: DataTypes.STRING(50), allowNull: true },
  description: { type: DataTypes.TEXT },
  category: { type: DataTypes.STRING(50), defaultValue: 'meeting' },
  is_default: { type: DataTypes.BOOLEAN, defaultValue: false },
  enabled: { type: DataTypes.BOOLEAN, defaultValue: true },
  created_by: { type: DataTypes.INTEGER, allowNull: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  timestamps: false
});

module.exports = ApprovalTemplate;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Notification = sequelize.define('notifications', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: 'id' } },
  type: { type: DataTypes.ENUM('popup','system_bar'), allowNull: false },
  content: { type: DataTypes.STRING(255), allowNull: false },
  is_read: { type: DataTypes.TINYINT, defaultValue: 0 },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  timestamps: false
});

Notification.belongsTo(User, { foreignKey: 'user_id' });

module.exports = Notification;

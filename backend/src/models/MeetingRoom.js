const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MeetingRoom = sequelize.define('meeting_rooms', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  location: { type: DataTypes.STRING(255), allowNull: false },
  capacity: { type: DataTypes.INTEGER, allowNull: false },
  description: { type: DataTypes.STRING(255) },
  seat_layout: { type: DataTypes.TEXT },
  status: { type: DataTypes.TINYINT, defaultValue: 1 },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  timestamps: false
});

module.exports = MeetingRoom;

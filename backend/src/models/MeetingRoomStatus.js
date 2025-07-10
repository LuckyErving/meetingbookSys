const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const MeetingRoom = require('./MeetingRoom');

const MeetingRoomStatus = sequelize.define('meeting_room_status', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  room_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: MeetingRoom, key: 'id' } },
  status: { type: DataTypes.ENUM('free','in_use','pending'), allowNull: false, defaultValue: 'free' },
  current_application_id: { type: DataTypes.INTEGER },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  timestamps: false
});

MeetingRoomStatus.belongsTo(MeetingRoom, { foreignKey: 'room_id' });

module.exports = MeetingRoomStatus;

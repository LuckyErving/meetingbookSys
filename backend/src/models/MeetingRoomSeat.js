const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const MeetingRoom = require('./MeetingRoom');

const MeetingRoomSeat = sequelize.define('meeting_room_seats', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  room_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: MeetingRoom, key: 'id' } },
  seat_number: { type: DataTypes.STRING(20), allowNull: false },
  seat_row: { type: DataTypes.INTEGER, allowNull: false },
  seat_col: { type: DataTypes.INTEGER, allowNull: false },
  label: { type: DataTypes.STRING(50) }
}, {
  timestamps: false
});

MeetingRoomSeat.belongsTo(MeetingRoom, { foreignKey: 'room_id' });

module.exports = MeetingRoomSeat;

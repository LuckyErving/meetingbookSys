const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const MeetingApplication = require('./MeetingApplication');
const User = require('./User');

const CCRecord = sequelize.define('cc_records', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  application_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: MeetingApplication, key: 'id' } },
  cc_user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: 'id' } },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  timestamps: false
});

CCRecord.belongsTo(MeetingApplication, { foreignKey: 'application_id' });
CCRecord.belongsTo(User, { foreignKey: 'cc_user_id' });

module.exports = CCRecord;

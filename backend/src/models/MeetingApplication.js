const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MeetingApplication = sequelize.define('meeting_applications', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  application_no: { type: DataTypes.STRING(50) },
  applicant_id: { type: DataTypes.INTEGER, allowNull: false },
  department_id: { type: DataTypes.INTEGER, allowNull: false },
  room_id: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT },
  meeting_type: { type: DataTypes.STRING(50), defaultValue: 'regular' },
  start_time: { type: DataTypes.DATE, allowNull: false },
  end_time: { type: DataTypes.DATE, allowNull: false },
  attendee_count: { type: DataTypes.INTEGER, defaultValue: 1 },
  contact_person: { type: DataTypes.STRING(50) },
  contact_phone: { type: DataTypes.STRING(20) },
  special_requirements: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('draft','pending','approved','rejected','cancelled','finished'), defaultValue: 'pending' },
  urgency_level: { type: DataTypes.ENUM('low','normal','high','urgent'), defaultValue: 'normal' },
  approval_template_id: { type: DataTypes.INTEGER },
  current_step: { type: DataTypes.INTEGER, defaultValue: 1 },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  timestamps: false
});

// 定义关联
MeetingApplication.associate = function(models) {
  MeetingApplication.belongsTo(models.User, { 
    foreignKey: 'applicant_id',
    as: 'applicant'
  });
  MeetingApplication.belongsTo(models.Department, { 
    foreignKey: 'department_id',
    as: 'applicantDepartment'
  });
  MeetingApplication.belongsTo(models.MeetingRoom, { 
    foreignKey: 'room_id',
    as: 'meetingRoom'
  });
  MeetingApplication.hasMany(models.ApprovalStep, { 
    foreignKey: 'application_id',
    as: 'approvalSteps'
  });
};

module.exports = MeetingApplication;

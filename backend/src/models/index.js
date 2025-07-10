const sequelize = require('../config/db');
const Department = require('./Department');
const User = require('./User');
const Role = require('./Role');
const UserRole = require('./UserRole');
const MeetingRoom = require('./MeetingRoom');
const MeetingRoomSeat = require('./MeetingRoomSeat');
const MeetingRoomStatus = require('./MeetingRoomStatus');
const MeetingApplication = require('./MeetingApplication');
const ApprovalFlow = require('./ApprovalFlow');
const ApprovalStep = require('./ApprovalStep');
const ApprovalRecord = require('./ApprovalRecord');
const ApprovalTemplate = require('./ApprovalTemplate');
const ApprovalTemplateStep = require('./ApprovalTemplateStep');
const CCRecord = require('./CCRecord');
const Notification = require('./Notification');

// 设置模型关联
const models = {
  Department,
  User,
  Role,
  UserRole,
  MeetingRoom,
  MeetingRoomSeat,
  MeetingRoomStatus,
  MeetingApplication,
  ApprovalFlow,
  ApprovalStep,
  ApprovalRecord,
  ApprovalTemplate,
  ApprovalTemplateStep,
  CCRecord,
  Notification
};

// 如果模型有associate方法，则调用它
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// 同步所有模型到数据库
async function syncModels() {
  await sequelize.sync({ alter: true });
  console.log('All models were synchronized successfully.');
}

module.exports = {
  syncModels,
  ...models
};

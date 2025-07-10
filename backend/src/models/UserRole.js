const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');
const Role = require('./Role');

const UserRole = sequelize.define('user_roles', {
  user_id: { type: DataTypes.INTEGER, references: { model: User, key: 'id' }, primaryKey: true },
  role_id: { type: DataTypes.INTEGER, references: { model: Role, key: 'id' }, primaryKey: true }
}, {
  timestamps: false
});

User.belongsToMany(Role, { through: UserRole, foreignKey: 'user_id' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'role_id' });

module.exports = UserRole;

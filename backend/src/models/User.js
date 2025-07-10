const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Department = require('./Department');

const User = sequelize.define('users', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  real_name: { type: DataTypes.STRING(50), allowNull: false },
  department_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: Department, key: 'id' } },
  email: { type: DataTypes.STRING(100) },
  phone: { type: DataTypes.STRING(20) },
  status: { type: DataTypes.TINYINT, defaultValue: 1 },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  timestamps: false
});

User.belongsTo(Department, { foreignKey: 'department_id' });

module.exports = User;

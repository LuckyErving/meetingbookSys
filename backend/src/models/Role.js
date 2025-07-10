const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Role = sequelize.define('roles', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  description: { type: DataTypes.STRING(100) }
}, {
  timestamps: false
});

module.exports = Role;

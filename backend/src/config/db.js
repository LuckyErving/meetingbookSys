const { Sequelize } = require('sequelize');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const sequelize = new Sequelize(process.env.DB_NAME || 'meetingBsys', process.env.DB_USER || 'yyw', process.env.DB_PASS || 'yyw110', {
  host: process.env.DB_HOST || 'localhost',
  dialect: 'mysql',
  port: process.env.DB_PORT || 3306,
  logging: false,
  timezone: '+08:00', // 设置为北京时间
  dialectOptions: {
    timezone: '+08:00', // MySQL连接时区
    dateStrings: true,
    typeCast: function (field, next) {
      // 对于日期时间字段，保持字符串格式以便正确处理时区
      if (field.type === 'DATETIME' || field.type === 'TIMESTAMP') {
        return field.string();
      }
      return next();
    }
  },
  define: {
    freezeTableName: true,
    // 使用自定义的时间字段
    timestamps: false
  }
});

module.exports = sequelize;

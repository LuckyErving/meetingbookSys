// 时间处理工具函数
const moment = require('moment-timezone');

// 将输入时间转换为北京时间的Date对象
function toBeijingDate(input) {
  if (!input) return null;
  
  let beijingTime;
  
  if (typeof input === 'string') {
    // 处理不同格式的字符串
    if (input.includes('T')) {
      // ISO格式：2025-07-09T15:00:00 或 2025-07-09T15:00:00Z
      if (input.endsWith('Z')) {
        // UTC时间，需要转换为北京时间
        beijingTime = moment.utc(input).tz('Asia/Shanghai');
      } else {
        // 假设是北京时间
        beijingTime = moment.tz(input, 'Asia/Shanghai');
      }
    } else {
      // 标准格式：2025-07-09 15:00:00，假设是北京时间
      beijingTime = moment.tz(input, 'Asia/Shanghai');
    }
  } else if (input instanceof Date) {
    // Date对象，转换为北京时间
    beijingTime = moment(input).tz('Asia/Shanghai');
  } else {
    beijingTime = moment.tz(input, 'Asia/Shanghai');
  }
  
  // 确保时间有效
  if (!beijingTime.isValid()) {
    return null;
  }
  
  return beijingTime.toDate();
}

// 将Date对象格式化为北京时间字符串
function formatBeijingTime(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return null;
  return moment(date).tz('Asia/Shanghai').format(format);
}

// 获取当前北京时间
function getNowBeijing() {
  return moment().tz('Asia/Shanghai').toDate();
}

// 将UTC时间字符串转换为北京时间字符串（用于前端显示）
function utcToBeijingString(utcString, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!utcString) return null;
  return moment.utc(utcString).tz('Asia/Shanghai').format(format);
}

module.exports = {
  toBeijingDate,
  formatBeijingTime,
  getNowBeijing,
  utcToBeijingString
};

// API 配置
export const API_CONFIG = {
  get baseURL() {
    // 优先使用用户设置，然后是环境变量，最后是默认值
    const userSettings = JSON.parse(localStorage.getItem('apiSettings') || '{}');
    if (userSettings.host && userSettings.port) {
      return `http://${userSettings.host}:${userSettings.port}`;
    }
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  },
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

// 设置管理
export const SETTINGS = {
  // 获取当前设置
  get() {
    const defaultSettings = {
      host: import.meta.env.VITE_DEFAULT_HOST || 'localhost',
      port: import.meta.env.VITE_DEFAULT_PORT || '3001'
    };
    const userSettings = JSON.parse(localStorage.getItem('apiSettings') || '{}');
    return { ...defaultSettings, ...userSettings };
  },
  
  // 保存设置
  save(settings) {
    localStorage.setItem('apiSettings', JSON.stringify(settings));
    console.log('API设置已保存:', settings);
  },
  
  // 重置设置
  reset() {
    localStorage.removeItem('apiSettings');
    console.log('API设置已重置');
  }
};

// API 端点
export const API_ENDPOINTS = {
  // 认证相关
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    profile: '/api/auth/profile',
    changePassword: '/api/auth/change-password'
  },
  
  // 申请相关
  applications: {
    list: '/api/applications',
    create: '/api/applications',
    detail: (id) => `/api/applications/${id}`,
    mine: '/api/applications/mine',
    mineTest: (userId) => `/api/applications/mine-test/${userId}`,
    allTest: '/api/applications/all-test'
  },
  
  // 审批相关
  approvals: {
    list: '/api/approvals',
    approve: (id) => `/api/approvals/${id}/approve`,
    reject: (id) => `/api/approvals/${id}/reject`,
    templateSteps: (id) => `/api/approvals/template-steps/${id}`,
    templateStepsTest: (id) => `/api/approvals/template-steps-test/${id}`
  },
  
  // 会议室相关
  rooms: {
    list: '/api/rooms',
    detail: (id) => `/api/rooms/${id}`,
    availability: (id) => `/api/rooms/${id}/availability`
  },
  
  // 部门相关
  departments: {
    list: '/api/departments',
    users: (id) => `/api/departments/${id}/users`
  },
  
  // 用户相关
  users: {
    list: '/api/users',
    detail: (id) => `/api/users/${id}`
  },
  
  // 日历相关
  calendar: {
    meetings: '/api/calendar/meetings'
  }
};

// 构建完整的 API URL
export function buildApiUrl(endpoint) {
  return `${API_CONFIG.baseURL}${endpoint}`;
}

// 获取认证头
export function getAuthHeaders() {
  const token = localStorage.getItem('token');
  console.log('获取认证头 - token:', token ? `${token.substring(0, 10)}...` : 'null');
  return {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  };
}

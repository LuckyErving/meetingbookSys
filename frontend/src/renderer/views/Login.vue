<template>
  <div class="login-bg">
    <!-- 设置按钮 -->
    <div class="settings-button-container">
      <el-button 
        circle 
        size="large" 
        class="settings-btn" 
        @click="showSettings = true"
        title="系统设置"
      >
        <span class="settings-icon">⚙️</span>
      </el-button>
    </div>

    <el-card class="login-card">
      <div class="login-title">
        <img src="https://img.icons8.com/ios-filled/50/409eff/conference-call.png" class="login-logo" />
        <span>会议室预订系统</span>
      </div>
      
      <!-- API地址显示 -->
      <div class="api-info">
        <span class="api-icon">🔗</span>
        <span class="api-text">{{ currentApiUrl }}</span>
      </div>

      <el-form :model="form" @submit.prevent="onLogin" class="login-form">
        <el-form-item label="用户名">
          <el-input v-model="form.username" size="large" clearable @keyup.enter="onLogin" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" size="large" clearable @keyup.enter="onLogin" />
        </el-form-item>
        <br>
        <el-form-item>
          <el-button type="primary" size="large" style="width:100%" @click="onLogin">登录</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="text" style="width:100%" @click="$router.push('/register')">没有账号？立即注册</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="text" style="width:100%" @click="$router.push('/forgot')">忘记密码？找回密码</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 设置对话框 -->
    <SettingsDialog v-model:visible="showSettings" />
  </div>
</template>

<script setup>
import { reactive, ref, nextTick, inject, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS, API_CONFIG } from '../config/api.js';
import SettingsDialog from '../components/SettingsDialog.vue';

const router = useRouter();
const showSettings = ref(false);
const form = reactive({ username: '', password: '' });

// 当前API地址
const currentApiUrl = computed(() => {
  return API_CONFIG.baseURL;
});

// 兼容App.vue的isLogin响应式
let isLogin;
try {
  isLogin = inject('isLogin');
} catch {}


import { onMounted } from 'vue';
onMounted(() => {
  const token = localStorage.getItem('token');
  if (token) {
    router.push('/');
  }
});

async function onLogin() {
  try {
    const res = await axios.post(buildApiUrl(API_ENDPOINTS.auth.login), form);
    console.log('登录响应:', res.data); // 调试日志
    
    // 保存认证信息
    localStorage.setItem('token', res.data.token);
    
    // 保存用户信息（如果后端有返回）
    if (res.data.user) {
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
    
    if (isLogin) isLogin.value = true;
    await nextTick();
    router.push('/');
  } catch (e) {
    console.error('登录失败:', e);
    alert(e.response?.data?.message || '登录失败');
  }
}
</script>

<style scoped>
.login-bg {
  min-height: 100vh;
  background: linear-gradient(135deg, #e0e7ff 0%, #f0fdfa 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.settings-button-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.settings-btn {
  background: rgba(255, 255, 255, 0.9) !important;
  border: 1px solid rgba(64, 158, 255, 0.3) !important;
  color: #409EFF !important;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.settings-btn:hover {
  background: #409EFF !important;
  color: white !important;
  border-color: #409EFF !important;
  transform: rotate(90deg);
}

.settings-icon {
  font-size: 18px;
  display: inline-block;
  transition: transform 0.3s ease;
}

.login-card {
  width: 380px;
  border-radius: 18px;
  box-shadow: 0 8px 32px 0 rgba(64,158,255,0.10);
  padding: 32px 32px 18px 32px;
  border: none !important;
  background: rgba(255,255,255,0.88);
}

.login-title {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 600;
  color: #409EFF;
  margin-bottom: 16px;
  letter-spacing: 2px;
}

.login-logo {
  width: 36px;
  height: 36px;
  margin-right: 10px;
}

.api-info {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  background: #f0f9ff;
  border: 1px solid #e0f2fe;
  border-radius: 8px;
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.api-info:hover {
  background: #e0f2fe;
}

.api-icon {
  color: #0ea5e9;
  margin-right: 6px;
  font-size: 16px;
}

.api-text {
  font-size: 13px;
  color: #0369a1;
  font-family: 'Monaco', 'Menlo', monospace;
  word-break: break-all;
}

.login-form {
  margin-top: 10px;
}
</style>

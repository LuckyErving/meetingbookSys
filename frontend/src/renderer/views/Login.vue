<template>
  <div class="login-bg">
    <el-card class="login-card">
      <div class="login-title">
        <img src="https://img.icons8.com/ios-filled/50/409eff/conference-call.png" class="login-logo" />
        <span>会议室预订系统</span>
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
  </div>
</template>

<script setup>
import { reactive, nextTick, inject } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS } from '../config/api.js';
const router = useRouter();
const form = reactive({ username: '', password: '' });
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
  margin-bottom: 28px;
  letter-spacing: 2px;
}
.login-logo {
  width: 36px;
  height: 36px;
  margin-right: 10px;
}
.login-form {
  margin-top: 10px;
}
</style>

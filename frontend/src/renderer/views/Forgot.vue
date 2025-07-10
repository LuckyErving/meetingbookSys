<template>
  <div class="forgot-bg">
    <el-card class="forgot-card">
      <div class="forgot-title">
        <img src="https://img.icons8.com/ios-filled/50/409eff/forgot-password.png" class="forgot-logo" />
        <span>找回密码</span>
      </div>
      <div class="forgot-info">
        <el-icon style="font-size:32px;color:#409EFF;margin-bottom:12px;"><i class="el-icon-warning-outline"></i></el-icon>
        <div style="font-size:16px;color:#666;line-height:2;">
          如需重置密码，请联系系统管理员。<br />
          <span style="color:#409EFF;font-weight:bold;">叶裕威（18198937272）</span><br />
          新质战斗力未来中心@2025
        </div>
        <br>
        <el-button type="primary" style="margin-top:24px;width:100%" @click="$router.push('/login')">返回登录</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS } from '../config/api.js';

const router = useRouter();
const form = reactive({ username: '', newPassword: '', confirmPassword: '' });

async function onSubmit() {
  if (!form.username || !form.newPassword || !form.confirmPassword) {
    alert('请填写完整信息');
    return;
  }
  if (form.newPassword !== form.confirmPassword) {
    alert('两次输入的新密码不一致');
    return;
  }
  try {
    await axios.post(buildApiUrl(`${API_ENDPOINTS.auth.login.replace('/login', '/forgot')}`), {
      username: form.username,
      newPassword: form.newPassword
    });
    alert('密码重置成功，请登录');
    router.push('/login');
  } catch (e) {
    alert(e.response?.data?.message || '重置失败');
  }
}
</script>

<style scoped>
.forgot-bg {
  min-height: 100vh;
  background: linear-gradient(135deg, #e0e7ff 0%, #f0fdfa 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.forgot-card {
  width: 380px;
  border-radius: 18px;
  box-shadow: 0 8px 32px 0 rgba(64,158,255,0.10);
  padding: 32px 32px 18px 32px;
  border: none !important;
  background: rgba(255,255,255,0.88);
}
.forgot-title {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 600;
  color: #409EFF;
  margin-bottom: 28px;
  letter-spacing: 2px;
}
.forgot-logo {
  width: 36px;
  height: 36px;
  margin-right: 10px;
}
.forgot-form {
  margin-top: 10px;
}
</style>

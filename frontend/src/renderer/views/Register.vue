<template>
  <div class="register-bg">
    <el-card class="register-card">
      <div class="register-title">
        <img src="https://img.icons8.com/ios-filled/50/409eff/add-user-group-man-man.png" class="register-logo" />
        <span>用户注册</span>
      </div>
      <el-form :model="form" @submit.prevent="onRegister" class="register-form">
        <el-form-item label="用户名">
          <el-input v-model="form.username" size="large" clearable />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" size="large" clearable />
        </el-form-item>
        <el-form-item label="真实姓名">
          <el-input v-model="form.real_name" size="large" clearable />
        </el-form-item>
        <el-form-item label="所属单位">
          <el-select v-model="form.department_id" placeholder="请选择单位" size="large">
            <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" style="width:100%" @click="onRegister">注册</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="text" style="width:100%" @click="$router.push('/login')">已有账号？返回登录</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS } from '../config/api.js';
const router = useRouter();
const form = reactive({ username: '', password: '', real_name: '', department_id: '' });
const departments = ref([]);

onMounted(async () => {
  // 获取单位列表
  const res = await axios.get(buildApiUrl(API_ENDPOINTS.departments.list));
  departments.value = res.data;
});

async function onRegister() {
  try {
    await axios.post(buildApiUrl(API_ENDPOINTS.auth.register), form);
    alert('注册成功，请登录');
    router.push('/login');
  } catch (e) {
    alert(e.response?.data?.message || '注册失败');
  }
}
</script>

<style scoped>
.register-bg {
  min-height: 100vh;
  background: linear-gradient(135deg, #e0e7ff 0%, #f0fdfa 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.register-card {
  width: 420px;
  border-radius: 18px;
  box-shadow: 0 8px 32px 0 rgba(64,158,255,0.10);
  padding: 32px 32px 18px 32px;
  border: none !important;
  background: rgba(255,255,255,0.88);
}
.register-title {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 600;
  color: #409EFF;
  margin-bottom: 28px;
  letter-spacing: 2px;
}
.register-logo {
  width: 36px;
  height: 36px;
  margin-right: 10px;
}
.register-form {
  margin-top: 10px;
}
</style>

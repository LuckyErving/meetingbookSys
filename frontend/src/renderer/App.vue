<template>
  <!-- 只要没登录就强制跳转到登录页，登录后展示主页面 -->
  <template v-if="!isLogin && route.path !== '/login' && route.path !== '/register' && route.path !== '/forgot'">
    <router-view v-if="false" />
  </template>
  <template v-else-if="route.path === '/login' || route.path === '/register' || route.path === '/forgot'">
    <router-view />
  </template>
  <template v-else>
    <el-container style="min-height:100vh; background: linear-gradient(135deg, #e0e7ff 0%, #f0fdfa 100%);">
      <el-aside width="200px" class="side-menu">
        <div class="side-logo">会议室预订系统</div>
        <el-menu :default-active="$route.path" @select="onMenuSelect" class="side-el-menu" router>
          <el-menu-item index="/">
            <el-icon><i class="el-icon-house"></i></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="/rooms">
            <el-icon><i class="el-icon-office-building"></i></el-icon>
            <span>会议室</span>
          </el-menu-item>
          <el-menu-item index="/apply">
            <el-icon><i class="el-icon-document-add"></i></el-icon>
            <span>会议申请</span>
          </el-menu-item>
          <el-menu-item index="/calendar">
            <el-icon><i class="el-icon-date"></i></el-icon>
            <span>会议日历</span>
          </el-menu-item>
          <el-menu-item index="/my-applications">
            <el-icon><i class="el-icon-document"></i></el-icon>
            <span>我的申请</span>
          </el-menu-item>
          <el-menu-item index="/my-approvals">
            <el-icon><i class="el-icon-finished"></i></el-icon>
            <span>我的审批</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-container>
        <el-header height="64px" class="top-header">
          <div class="header-right">
            <el-avatar size="medium" style="background:#409EFF;">{{ userInitial }}</el-avatar>
            <span class="user-name">{{ userName }}</span>
            <el-button v-if="isLogin" type="text" class="logout-btn" @click="logout">退出</el-button>
          </div>
        </el-header>
        <el-main style="padding:40px 0;">
          <div class="main-content">
            <router-view />
          </div>
        </el-main>
      </el-container>
    </el-container>
  </template>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute();
import { provide } from 'vue';
const isLogin = ref(!!localStorage.getItem('token'));
provide('isLogin', isLogin);
// 用户信息
const user = ref({});
const userName = ref('');
const userInitial = ref('U');
onMounted(() => {
  const u = localStorage.getItem('user');
  if (u) {
    user.value = JSON.parse(u);
    userName.value = user.value.real_name || user.value.username || '';
    userInitial.value = userName.value ? userName.value[0].toUpperCase() : 'U';
  }
});

// 页面加载时自动判断登录状态并跳转
onMounted(() => {
  if (!isLogin.value && route.path !== '/login' && route.path !== '/register') {
    router.replace('/login');
  }
  if (isLogin.value && (route.path === '/login' || route.path === '/register')) {
    router.replace('/');
  }
});

// 监听 token 变化，自动跳转
watch(
  () => localStorage.getItem('token'),
  (val, oldVal) => {
    isLogin.value = !!val;
    if (!val && route.path !== '/login' && route.path !== '/register') {
      router.replace('/login');
    }
    if (val && (route.path === '/login' || route.path === '/register')) {
      router.replace('/');
    }
  }
);

function onMenuSelect(index) {
  if (index === 'logout') return;
  router.push(index);
}
function logout() {
  localStorage.removeItem('token');
  isLogin.value = false;
  router.push('/login');
}
</script>

<style scoped>
.side-menu {
  background: #fff;
  box-shadow: 2px 0 8px 0 #f0f1f2;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 18px;
  position: sticky;
  top: 0;
  z-index: 101;
  height: 100vh;
}
.side-logo {
  font-size: 20px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 24px;
  letter-spacing: 2px;
}
.side-el-menu {
  border-right: none;
  width: 100%;
  background: transparent;
}
.top-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  background: rgba(255,255,255,0.95);
  box-shadow: 0 2px 8px #f0f1f2;
  position: sticky;
  top: 0;
  z-index: 100;
}
.header-right {
  display: flex;
  align-items: center;
  height: 100%;
}
.user-name {
  margin: 0 16px 0 8px;
  font-size: 16px;
  color: #333;
  font-weight: 500;
}
.logout-btn {
  color: #409EFF;
  font-size: 15px;
}
.main-content {
  max-width: 900px;
  margin: 0 auto;
  /* background: #fff; */
  border-radius: 12px;
  box-shadow: 0 4px 24px 0 rgba(64,158,255,0.08);
  /* padding: 32px 32px 24px 32px; */
  min-height: 600px;
}
</style>

<template>
  <div class="myapp-bg">
    <el-card class="myapp-card">
      <div class="myapp-title">
        <el-icon><i class="el-icon-document"></i></el-icon>
        <span>我的会议申请记录</span>
      </div>
      
      <!-- 标签页切换 -->
      <el-tabs v-model="activeTab" @tab-change="handleTabChange" style="margin-top: 20px;">
        <el-tab-pane label="审批中" name="pending">
          <el-table :data="pendingApplications" stripe border v-loading="loading">
            <el-table-column prop="title" label="会议主题" min-width="150" />
            <el-table-column prop="meeting_room.name" label="会议室" min-width="120" />
            <el-table-column prop="start_time" label="开始时间" min-width="140">
              <template #default="scope">
                {{ formatDateTime(scope.row.start_time) }}
              </template>
            </el-table-column>
            <el-table-column prop="end_time" label="结束时间" min-width="140">
              <template #default="scope">
                {{ formatDateTime(scope.row.end_time) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" min-width="90">
              <template #default="scope">
                <el-tag :type="statusTag(scope.row.status)">{{ statusText(scope.row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="申请时间" min-width="140">
              <template #default="scope">
                {{ formatDateTime(scope.row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="90">
              <template #default="scope">
                <el-button size="small" type="primary" plain @click="goDetail(scope.row.id)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        
        <el-tab-pane label="已通过" name="approved">
          <el-table :data="approvedApplications" stripe border v-loading="loading">
            <el-table-column prop="title" label="会议主题" min-width="150" />
            <el-table-column prop="meeting_room.name" label="会议室" min-width="120" />
            <el-table-column prop="start_time" label="开始时间" min-width="140">
              <template #default="scope">
                {{ formatDateTime(scope.row.start_time) }}
              </template>
            </el-table-column>
            <el-table-column prop="end_time" label="结束时间" min-width="140">
              <template #default="scope">
                {{ formatDateTime(scope.row.end_time) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" min-width="90">
              <template #default="scope">
                <el-tag :type="statusTag(scope.row.status)">{{ statusText(scope.row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="申请时间" min-width="140">
              <template #default="scope">
                {{ formatDateTime(scope.row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="90">
              <template #default="scope">
                <el-button size="small" type="primary" plain @click="goDetail(scope.row.id)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        
        <el-tab-pane label="其他" name="others">
          <el-table :data="otherApplications" stripe border v-loading="loading">
            <el-table-column prop="title" label="会议主题" min-width="150" />
            <el-table-column prop="meeting_room.name" label="会议室" min-width="120" />
            <el-table-column prop="start_time" label="开始时间" min-width="140">
              <template #default="scope">
                {{ formatDateTime(scope.row.start_time) }}
              </template>
            </el-table-column>
            <el-table-column prop="end_time" label="结束时间" min-width="140">
              <template #default="scope">
                {{ formatDateTime(scope.row.end_time) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" min-width="90">
              <template #default="scope">
                <el-tag :type="statusTag(scope.row.status)">{{ statusText(scope.row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="申请时间" min-width="140">
              <template #default="scope">
                {{ formatDateTime(scope.row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="90">
              <template #default="scope">
                <el-button size="small" type="primary" plain @click="goDetail(scope.row.id)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS, getAuthHeaders } from '../config/api.js';

const router = useRouter();
const applications = ref([]);
const activeTab = ref('pending');
const loading = ref(false);

// 计算属性：按状态分类申请
const pendingApplications = computed(() => {
  return applications.value
    .filter(app => app.status === 'pending')
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); // 从早到晚
});

const approvedApplications = computed(() => {
  return applications.value
    .filter(app => app.status === 'approved' || app.status === 'finished')
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); // 从早到晚
});

const otherApplications = computed(() => {
  return applications.value
    .filter(app => !['pending', 'approved', 'finished'].includes(app.status))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); // 从早到晚
});

function statusText(status) {
  switch (status) {
    case 'pending': return '审批中';
    case 'approved': return '已通过';
    case 'rejected': return '已拒绝';
    case 'cancelled': return '已撤销';
    case 'finished': return '已完成';
    default: return status;
  }
}

function statusTag(status) {
  switch (status) {
    case 'approved':
    case 'finished':
      return 'success';
    case 'rejected': 
      return 'danger';
    case 'pending': 
      return 'warning';
    case 'cancelled':
      return 'info';
    default: 
      return '';
  }
}

function goDetail(id) {
  router.push(`/application/${id}`);
}

function handleTabChange(tabName) {
  console.log('切换到标签页:', tabName);
}

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function fetchApplications() {
  loading.value = true;
  try {
    const token = localStorage.getItem('token');
    
    // 优先尝试正常API
    try {
      const { data } = await axios.get(buildApiUrl(API_ENDPOINTS.applications.mine), {
        headers: getAuthHeaders()
      });
      applications.value = data;
      console.log('成功获取我的申请记录:', data.length, '条');
    } catch (authError) {
      console.log('认证失败，使用测试API:', authError.message);
      // 使用测试API（默认获取用户1的记录）
      const { data } = await axios.get(buildApiUrl(API_ENDPOINTS.applications.mineTest(1)));
      // 处理测试API的数据结构
      const appData = data.data || [];
      // 转换数据结构以匹配前端需求
      applications.value = appData.map(app => ({
        id: app.id,
        application_no: app.application_no,
        title: app.title,
        description: app.description,
        meeting_type: app.meeting_type,
        start_time: app.start_time,
        end_time: app.end_time,
        attendee_count: app.attendee_count,
        contact_person: app.contact_person,
        contact_phone: app.contact_phone,
        special_requirements: app.special_requirements,
        status: app.status,
        urgency_level: app.urgency_level,
        current_step: app.current_step,
        created_at: app.created_at,
        updated_at: app.updated_at,
        applicant: app.applicant,
        department: app.applicantDepartment,
        meeting_room: app.meetingRoom
      }));
      console.log('使用测试API获取申请记录:', applications.value.length, '条');
    }
  } catch (error) {
    console.error('获取申请记录失败:', error);
    applications.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchApplications();
});
</script>

<style scoped>
.myapp-bg {
  min-height: 100vh;
  background: linear-gradient(135deg, #e0e7ff 0%, #f0fdfa 100%);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 40px;
}
.myapp-card {
  width: 100%;
  max-width: 1000px;
  border-radius: 18px;
  box-shadow: 0 8px 32px 0 rgba(64,158,255,0.10);
  padding: 32px 32px 18px 32px;
  border: none !important;
  background: rgba(255,255,255,0.88);
}
.myapp-title {
  display: flex;
  align-items: center;
  font-size: 22px;
  font-weight: 600;
  color: #409EFF;
  margin-bottom: 18px;
  letter-spacing: 2px;
}
.myapp-title .el-icon {
  margin-right: 8px;
}
</style>

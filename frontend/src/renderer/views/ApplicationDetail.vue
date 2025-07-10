<template>
  <div class="apply-bg">
    <el-card class="apply-card">
      <div class="apply-title">
        <img src="https://img.icons8.com/ios-filled/50/409eff/submit-for-approval.png" class="apply-logo" />
        <span>会议申请详情</span>
      </div>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="会议主题">{{ application?.title }}</el-descriptions-item>
        <el-descriptions-item label="会议室">{{ application?.meeting_room?.name }}</el-descriptions-item>
        <el-descriptions-item label="时间">{{ application?.start_time }} ~ {{ application?.end_time }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ application?.applicant?.real_name }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTag(application?.status)">{{ statusText(application?.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="描述">{{ application?.description }}</el-descriptions-item>
      </el-descriptions>
      <div style="margin:24px 0 10px 0;font-weight:500;color:#409EFF;">审批流程</div>
      <ApprovalFlow :steps="approvalSteps" />
      <div v-if="canApprove" style="margin-top:18px;">
        <el-form :model="approveForm" inline @submit.prevent="onApprove">
          <el-form-item label="审批意见">
            <el-input v-model="approveForm.comment" placeholder="可填写审批意见" style="width:220px" />
          </el-form-item>
          <el-form-item>
            <el-button type="success" @click="onApprove('approve')">同意</el-button>
            <el-button type="danger" @click="onApprove('reject')">拒绝</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import ApprovalFlow from '../components/ApprovalFlow.vue';
import { buildApiUrl, API_ENDPOINTS, getAuthHeaders } from '../config/api.js';

const route = useRoute();
const application = ref(null);
const approvalSteps = ref([]);
const originalSteps = ref([]); // 保存原始审批步骤数据用于权限判断
const approveForm = ref({ comment: '' });

// 从localStorage获取用户信息
const getUserId = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user.id;
    } catch (e) {
      console.error('解析用户信息失败:', e);
    }
  }
  return null;
};

const userId = getUserId();

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
    case 'approved': return 'success';
    case 'rejected': return 'danger';
    case 'pending': return 'warning';
    default: return '';
  }
}

const canApprove = computed(() => {
  // 当前用户是审批流中第一个待审批的审批人
  const step = originalSteps.value.find(s => s.status === 'pending');
  return step && step.approver && step.approver.id === userId;
});

async function fetchDetail() {
  try {
    const { data: app } = await axios.get(buildApiUrl(`${API_ENDPOINTS.applications.list}/${route.params.id}`), 
      getAuthHeaders()
    );
    
    application.value = app;
    originalSteps.value = app.approval_steps || []; // 保存原始数据
    
    // 转换审批步骤数据格式以适配ApprovalFlow组件
    approvalSteps.value = (app.approval_steps || []).map(step => ({
      ...step,
      dept: step.department?.name || '未知部门',
      leader: step.approver?.real_name || '未分配',
      status: step.status === 'approved' ? 'done' : 
              step.status === 'rejected' ? 'reject' : 'pending'
    }));
    
    console.log('申请详情:', app);
    console.log('转换后的审批步骤:', approvalSteps.value);
    console.log('当前用户ID:', userId);
    console.log('可以审批:', canApprove.value);
  } catch (error) {
    console.error('获取申请详情失败:', error);
    // 可以添加错误提示
  }
}

async function onApprove(action) {
  try {
    const step = originalSteps.value.find(s => s.status === 'pending' && s.approver && s.approver.id === userId);
    if (!step) {
      console.log('没有找到可操作的审批步骤');
      return;
    }
    
    const approvalAction = action === 'approve' ? 'approved' : 'rejected';
    await axios.post(buildApiUrl('/api/approvals/action'), {
      step_id: step.id,
      action: approvalAction,
      comment: approveForm.value.comment
    }, getAuthHeaders());
    
    approveForm.value.comment = '';
    await fetchDetail();
    console.log('审批操作成功');
  } catch (error) {
    console.error('审批操作失败:', error);
  }
}

onMounted(fetchDetail);
</script>

<style scoped>
.apply-bg {
  min-height: 100vh;
  background: linear-gradient(135deg, #e0e7ff 0%, #f0fdfa 100%);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 40px;
}
.apply-card {
  width: 100%;
  max-width: 600px;
  border-radius: 18px;
  box-shadow: 0 8px 32px 0 rgba(64,158,255,0.10);
  padding: 32px 32px 18px 32px;
}
.apply-title {
  display: flex;
  align-items: center;
  font-size: 22px;
  font-weight: 600;
  color: #409EFF;
  margin-bottom: 28px;
  letter-spacing: 2px;
  justify-content: center;
}
.apply-logo {
  width: 36px;
  height: 36px;
  margin-right: 10px;
}
</style>

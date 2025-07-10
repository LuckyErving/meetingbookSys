<template>
  <div class="myapp-bg">
    <el-card class="myapp-card">
      <div class="myapp-title">
        <el-icon><i class="el-icon-s-check"></i></el-icon>
        <span>我的审批事项</span>
      </div>
      
      <!-- 标签页切换 -->
      <el-tabs v-model="activeTab" @tab-change="handleTabChange" style="margin-top: 20px;">
        <el-tab-pane label="待审批" name="pending">
          <el-table :data="pendingApprovals" stripe border v-loading="loading">
            <el-table-column prop="step_name" label="审批环节" min-width="120" />
            <el-table-column prop="application.title" label="会议主题" min-width="150" />
            <el-table-column prop="application.applicant.real_name" label="申请人" min-width="100" />
            <el-table-column prop="application.department.name" label="申请部门" min-width="120" />
            <el-table-column prop="application.meeting_room.name" label="会议室" min-width="120" />
            <el-table-column prop="application.start_time" label="开始时间" min-width="140">
              <template #default="scope">
                {{ formatDateTime(scope.row.application.start_time) }}
              </template>
            </el-table-column>
            <el-table-column prop="application.end_time" label="结束时间" min-width="140">
              <template #default="scope">
                {{ formatDateTime(scope.row.application.end_time) }}
              </template>
            </el-table-column>
            <el-table-column prop="application.urgency_level" label="紧急程度" min-width="100">
              <template #default="scope">
                <el-tag :type="urgencyTag(scope.row.application.urgency_level)">
                  {{ urgencyText(scope.row.application.urgency_level) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="180" fixed="right">
              <template #default="scope">
                <el-button size="small" type="success" @click="handleApproval(scope.row, 'approved')">
                  同意
                </el-button>
                <el-button size="small" type="danger" @click="handleApproval(scope.row, 'rejected')">
                  拒绝
                </el-button>
                <el-button size="small" type="primary" plain @click="viewDetail(scope.row.application_id)">
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        
        <el-tab-pane label="审批历史" name="history">
          <el-table :data="historyApprovals" stripe border v-loading="loading">
            <el-table-column prop="step_name" label="审批环节" min-width="120" />
            <el-table-column prop="application.title" label="会议主题" min-width="150" />
            <el-table-column prop="application.applicant.real_name" label="申请人" min-width="100" />
            <el-table-column prop="status" label="审批结果" min-width="100">
              <template #default="scope">
                <el-tag :type="statusTag(scope.row.status)">{{ statusText(scope.row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="approval_time" label="审批时间" min-width="140">
              <template #default="scope">
                {{ formatDateTime(scope.row.approval_time) }}
              </template>
            </el-table-column>
            <el-table-column prop="comment" label="审批意见" min-width="150" show-overflow-tooltip />
            <el-table-column label="操作" min-width="90">
              <template #default="scope">
                <el-button size="small" type="primary" plain @click="viewDetail(scope.row.application_id)">
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <!-- 分页 -->
          <el-pagination
            v-if="historyTotal > 0"
            :current-page="currentPage"
            :page-size="pageSize"
            :total="historyTotal"
            layout="total, prev, pager, next, jumper"
            @current-change="handlePageChange"
            style="margin-top: 20px; text-align: center;"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 审批对话框 -->
    <el-dialog v-model="approvalDialogVisible" :title="approvalTitle" width="500px">
      <el-form>
        <el-form-item label="审批意见">
          <el-input 
            v-model="approvalComment" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入审批意见..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approvalDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmApproval" :loading="submitting">
          确认{{ approvalAction === 'approved' ? '同意' : '拒绝' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import axios from 'axios';

import { buildApiUrl, API_ENDPOINTS, getAuthHeaders } from '../config/api.js';

// ...existing code...

// 数据状态
const activeTab = ref('pending');
const loading = ref(false);
const pendingApprovals = ref([]);
const historyApprovals = ref([]);
const historyTotal = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

// 审批对话框
const approvalDialogVisible = ref(false);
const approvalAction = ref('');
const approvalComment = ref('');
const approvalStepId = ref(null);
const submitting = ref(false);

// 计算属性
const approvalTitle = computed(() => {
  return approvalAction.value === 'approved' ? '同意申请' : '拒绝申请';
});

// 工具函数
function statusText(status) {
  switch (status) {
    case 'pending': return '待审批';
    case 'approved': return '已同意';
    case 'rejected': return '已拒绝';
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

function urgencyText(level) {
  switch (level) {
    case 'low': return '低';
    case 'normal': return '普通';
    case 'high': return '高';
    case 'urgent': return '紧急';
    default: return level;
  }
}

function urgencyTag(level) {
  switch (level) {
    case 'urgent': return 'danger';
    case 'high': return 'warning';
    case 'normal': return '';
    case 'low': return 'info';
    default: return '';
  }
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

// 页面方法
function viewDetail(applicationId) {
  router.push(`/application/${applicationId}`);
}

function handleTabChange(tab) {
  if (tab === 'pending') {
    loadPendingApprovals();
  } else if (tab === 'history') {
    loadHistoryApprovals();
  }
}

function handlePageChange(page) {
  currentPage.value = page;
  loadHistoryApprovals();
}

function handleApproval(row, action) {
  approvalStepId.value = row.id;
  approvalAction.value = action;
  approvalComment.value = '';
  approvalDialogVisible.value = true;
}

async function confirmApproval() {
  if (!approvalComment.value.trim()) {
    ElMessage.warning('请输入审批意见');
    return;
  }

  submitting.value = true;
  try {
    await axios.post(buildApiUrl('/api/approvals/action'), {
      step_id: approvalStepId.value,
      action: approvalAction.value,
      comment: approvalComment.value
    }, getAuthHeaders());

    ElMessage.success(`${approvalAction.value === 'approved' ? '同意' : '拒绝'}审批成功`);
    approvalDialogVisible.value = false;
    
    // 刷新待审批列表
    loadPendingApprovals();
  } catch (error) {
    console.error('审批操作失败:', error);
    ElMessage.error('操作失败：' + (error.response?.data?.message || error.message));
  } finally {
    submitting.value = false;
  }
}

// 加载数据方法
async function loadPendingApprovals() {
  loading.value = true;
  try {
    console.log('开始获取待审批事项...');
    console.log('API URL:', buildApiUrl('/api/approvals/mine'));
    console.log('认证头:', getAuthHeaders());
    
    const { data } = await axios.get(buildApiUrl('/api/approvals/mine'), 
      getAuthHeaders()
    );
    pendingApprovals.value = data;
    console.log('成功获取待审批事项:', data.length, '条');
  } catch (error) {
    console.error('获取待审批事项失败:', error);
    console.error('错误详情:', error.response?.data);
    ElMessage.error('获取待审批事项失败：' + (error.response?.data?.message || error.message));
    pendingApprovals.value = [];
  } finally {
    loading.value = false;
  }
}

async function loadHistoryApprovals() {
  loading.value = true;
  try {
    const { data } = await axios.get(buildApiUrl(`/api/approvals/history?page=${currentPage.value}&limit=${pageSize.value}`),
      getAuthHeaders()
    );
    historyApprovals.value = data.data;
    historyTotal.value = data.total;
    console.log('成功获取审批历史:', data.data.length, '条');
  } catch (error) {
    console.error('获取审批历史失败:', error);
    ElMessage.error('获取审批历史失败：' + (error.response?.data?.message || error.message));
    historyApprovals.value = [];
    historyTotal.value = 0;
  } finally {
    loading.value = false;
  }
}

// 生命周期
onMounted(() => {
  loadPendingApprovals();
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

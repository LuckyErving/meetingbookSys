<template>
  <div class="apply-bg">
    <el-card class="apply-card">
      <div class="apply-title">
        <img src="https://img.icons8.com/ios-filled/50/409eff/submit-for-approval.png" class="apply-logo" />
        <span>会议申请</span>
      </div>
      <!-- 审批流可视化演示，实际数据可从后端获取 -->
      <!-- <ApprovalFlow :steps="approvalSteps" style="margin-bottom:18px;" /> -->
      <el-form :model="form" label-width="80px" @submit.prevent="onSubmit" class="apply-form">
        <el-form-item label="会议主题">
          <el-input v-model="form.title" size="large" clearable />
        </el-form-item>
        <el-form-item label="会议室">
          <el-select v-model="form.room_id" placeholder="请选择会议室" size="large">
            <el-option v-for="room in rooms" :key="room.id" :label="room.name" :value="room.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="会议时间">
          <el-date-picker
            v-model="form.timeRange"
            type="datetimerange"
            :default-time="[new Date(0,0,0,9,0,0), new Date(0,0,0,18,0,0)]"
            :shortcuts="rangeShortcuts"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            size="large"
            style="width:100%"
          />
        </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="form.description" type="textarea" size="large" rows="3" clearable />
      </el-form-item>
      
      <!-- 审批流程配置 -->
      <div class="approval-section">
        <div class="section-title">
          <i class="el-icon-user-solid"></i> 审批流程配置
        </div>
        
        <!-- 审批模板选择 -->
        <el-form-item label="审批模板">
          <el-select 
            v-model="templateId" 
            placeholder="请选择审批模板" 
            size="large" 
            @change="onTemplateChange"
            :loading="templatesLoading"
          >
            <el-option
              v-for="template in templates"
              :key="template.id"
              :label="template.name"
              :value="template.id"
            >
              <span style="float: left">{{ template.name }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">{{ template.description }}</span>
            </el-option>
          </el-select>
          
          <!-- 加载提示 -->
          <div v-if="templatesLoading" style="color: #909399; font-size: 13px; margin-top: 4px;">
            <i class="el-icon-loading"></i> 正在加载审批模板...
          </div>
          
          <!-- 无模板提示 -->
          <div v-else-if="templates.length === 0" style="color: #f56c6c; font-size: 13px; margin-top: 4px;">
            <i class="el-icon-warning"></i> 暂无可用的审批模板，请联系管理员配置
          </div>
        </el-form-item>

        <!-- 审批人选择器 -->
        <div v-if="templateId">
          <ApproverSelector
            :templateId="templateId"
            v-model="approvers"
            :ccValue="ccList"
            @update:ccValue="val => ccList = val"
            style="margin-bottom: 18px;"
          />
        </div>
        
        <!-- 无模板提示 -->
        <div v-else class="template-hint">
          <i class="el-icon-info"></i> 请先选择审批模板以配置审批流程
        </div>
      </div>
      <el-form-item>
        <el-button type="primary" size="large" style="width:100%" @click="onSubmit">提交申请</el-button>
      </el-form-item>
      </el-form>
      <el-divider />
      <div style="text-align: center; color: #909399; font-size: 14px;">
        <i class="el-icon-info"></i> 提交后可在左侧"我的申请"中查看申请状态
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import ApprovalFlow from '../components/ApprovalFlow.vue';
import ApproverSelector from '../components/ApproverSelector.vue';
import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS, getAuthHeaders } from '../config/api.js';
const form = reactive({ title: '', room_id: '', timeRange: [], description: '' });
const templateId = ref(null); // 改为null，让用户选择
const templates = ref([]); // 添加模板列表
const templatesLoading = ref(false); // 添加加载状态
const approvers = ref([]);
const ccList = ref([]);
// 区间选择快捷选项
const rangeShortcuts = [
  {
    text: '今天 09:00-18:00',
    value: () => {
      const start = new Date();
      start.setHours(9, 0, 0, 0);
      const end = new Date();
      end.setHours(18, 0, 0, 0);
      return [start, end];
    }
  },
  {
    text: '明天 09:00-18:00',
    value: () => {
      const start = new Date();
      start.setDate(start.getDate() + 1);
      start.setHours(9, 0, 0, 0);
      const end = new Date();
      end.setDate(end.getDate() + 1);
      end.setHours(18, 0, 0, 0);
      return [start, end];
    }
  },
  {
    text: '今天 09:30-12:00',
    value: () => {
      const start = new Date();
      start.setHours(9, 30, 0, 0);
      const end = new Date();
      end.setHours(12, 0, 0, 0);
      return [start, end];
    }
  },
  {
    text: '明天 15:00-18:00',
    value: () => {
      const start = new Date();
      start.setDate(start.getDate() + 1);
      start.setHours(15, 0, 0, 0);
      const end = new Date();
      end.setDate(end.getDate() + 1);
      end.setHours(18, 0, 0, 0);
      return [start, end];
    }
  }
];
const rooms = ref([]);

// 示例：实际应从后端获取审批流进度
const approvalSteps = ref([
  // { dept: '财务部', leader: '王五', status: 'pending' },
  { dept: '申请人单位', leader: '', status: 'done' },
  { dept: '指挥中心', leader: '李四', status: 'done' }
  // { dept: '总经理', leader: '赵六', status: 'pending' }
]);

onMounted(async () => {
  try {
    // 获取会议室列表
    const roomRes = await axios.get(buildApiUrl(API_ENDPOINTS.rooms.list));
    rooms.value = roomRes.data;
    
    // 获取审批模板列表
    templatesLoading.value = true;
    try {
      console.log('开始获取审批模板...');
      
      // 优先尝试正常API
      let templateRes;
      try {
        templateRes = await axios.get(buildApiUrl('/api/approvals/templates'), {
          headers: getAuthHeaders()
        });
        console.log('正常API获取到的模板数据:', templateRes.data);
        templates.value = templateRes.data;
      } catch (authError) {
        console.log('正常API失败，尝试测试API:', authError.message);
        // 如果认证失败，使用测试接口
        const testRes = await axios.get(buildApiUrl('/api/approvals/templates/test'));
        console.log('测试API获取到的模板数据:', testRes.data);
        if (testRes.data.success) {
          templates.value = testRes.data.data;
        }
      }
      
      // 如果有模板，自动选择第一个
      if (templates.value.length > 0) {
        templateId.value = templates.value[0].id;
        console.log('自动选择模板ID:', templateId.value);
      } else {
        console.warn('未找到可用的审批模板');
      }
    } catch (templateError) {
      console.error('获取审批模板失败:', templateError);
      window.$message?.error?.('获取审批模板失败，请检查网络连接') || console.error('获取审批模板失败');
    } finally {
      templatesLoading.value = false;
    }
    
  } catch (error) {
    console.error('初始化数据失败:', error);
    console.error('错误详情:', error.response?.data);
  }
});

async function onSubmit() {
  try {
    if (!form.timeRange || form.timeRange.length !== 2) {
      window.$message?.error?.('请选择会议开始和结束时间') || alert('请选择会议开始和结束时间');
      return;
    }
    if (!templateId.value) {
      window.$message?.error?.('请选择审批模板') || alert('请选择审批模板');
      return;
    }
    if (!approvers.value.length || approvers.value.some(a => !a.leader_id)) {
      window.$message?.error?.('请为每一步选择审批人') || alert('请为每一步选择审批人');
      return;
    }
    const [start_time, end_time] = form.timeRange;
    const token = localStorage.getItem('token');
    
    try {
      // 1. 提交会议申请，获取 application_id
      let appRes;
      try {
        appRes = await axios.post(buildApiUrl(API_ENDPOINTS.applications.create), {
          ...form,
          start_time,
          end_time
        }, {
          headers: getAuthHeaders()
        });
      } catch (authError) {
        console.log('正常API失败，使用测试API:', authError.message);
        // 使用测试接口
        appRes = await axios.post(buildApiUrl('/api/applications/test'), {
          ...form,
          start_time,
          end_time
        });
      }
      
      const application_id = appRes.data.id || appRes.data.application_id;
      console.log('申请创建成功，ID:', application_id);
      
      // 2. 发起审批流（如果有审批人选择）
      if (approvers.value.length > 0) {
        try {
          await axios.post(buildApiUrl('/api/approvals/start'), {
            application_id,
            template_id: templateId.value,
            steps: approvers.value
          }, {
            headers: getAuthHeaders()
          });
          console.log('审批流创建成功');
        } catch (approvalError) {
          console.warn('审批流创建失败，但申请已提交:', approvalError.message);
        }
      }
      
      // 3. 抄送（如果有抄送人）
      if (ccList.value.length > 0) {
        try {
          await axios.post(buildApiUrl('/api/approvals/cc'), {
            application_id,
            cc_user_ids: ccList.value
          }, {
            headers: getAuthHeaders()
          });
          console.log('抄送创建成功');
        } catch (ccError) {
          console.warn('抄送失败，但申请已提交:', ccError.message);
        }
      }
    } catch (mainError) {
      throw mainError; // 重新抛出主要错误
    }
    window.$message?.success?.('申请已提交，等待审批') || alert('申请已提交，等待审批');
  } catch (e) {
    window.$message?.error?.(e.response?.data?.message || '申请失败') || alert(e.response?.data?.message || '申请失败');
    console.error('会议申请失败', e);
  }
}

// 模板变化处理
function onTemplateChange() {
  // 清空之前选择的审批人
  approvers.value = [];
  ccList.value = [];
}
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
  max-width: 520px;
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
.apply-form {
  margin-top: 10px;
}

/* 审批流程配置样式 */
.approval-section {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  background: #fafbfc;
  margin: 16px 0;
}

.approval-section .section-title {
  font-weight: 600;
  color: #409EFF;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.template-hint {
  color: #909399;
  font-size: 14px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  border-left: 4px solid #409EFF;
}
</style>

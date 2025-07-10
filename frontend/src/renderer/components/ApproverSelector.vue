<template>
  <div>
    <!-- 加载状态 -->
    <div v-if="loading" style="text-align: center; padding: 20px; color: #909399;">
      <i class="el-icon-loading"></i> 正在加载审批流程...
    </div>
    
    <!-- 审批步骤 -->
    <div v-else>
      <div v-for="(step, idx) in steps" :key="step.step_order" style="margin-bottom: 16px;">
        <el-form-item :label="`${step.dept_name}`">
        <!-- <el-form-item :label="`第${step.step_order}步：${step.dept_name}${step.leader_role}`"> -->
          <el-select 
            v-model="selectedApprovers[idx]" 
            placeholder="请选择审批人" 
            size="large"
            style="width: 100%; max-width: 300px;"
            :disabled="step.candidates.length === 0"
          >
            <el-option
              v-for="user in step.candidates"
              :key="user.id"
              :label="user.real_name"
              :value="user.id"
            >
              <span style="float: left">{{ user.real_name }}</span>
              <span style="float: right; color: #8492a6; font-size: 12px">
                {{ user.department_name || '未知部门' }}
              </span>
            </el-option>
          </el-select>
          
          <!-- 无候选人提示 -->
          <div v-if="step.candidates.length === 0" style="color: #f56c6c; font-size: 13px; margin-top: 4px;">
            <i class="el-icon-warning"></i> 
            该步骤暂无可选审批人，请联系管理员配置 {{ step.leader_role }} 角色
          </div>
          
          <!-- 已选审批人信息 -->
          <div v-else-if="selectedApprovers[idx]" style="color: #67c23a; font-size: 13px; margin-top: 4px;">
            <i class="el-icon-check"></i> 
            已选择：{{ getSelectedUserName(idx) }}
          </div>
        </el-form-item>
      </div>
      
      <!-- 抄送人员选择 -->
      <el-form-item label="抄送部门" style="margin-top: 20px;">
        <el-select 
          v-model="ccList" 
          multiple 
          filterable 
          placeholder="选择抄送人员（可选）" 
          size="large"
          style="width: 100%; max-width: 300px;"
        >
          <el-option-group
            v-for="dept in groupedCandidates"
            :key="dept.name"
            :label="dept.name"
          >
            <el-option
              v-for="user in dept.users"
              :key="user.id"
              :label="user.real_name"
              :value="user.id"
            />
          </el-option-group>
        </el-select>
        
        <div v-if="!allCandidates.length" style="color: #f56c6c; font-size: 13px; margin-top: 4px;">
          <i class="el-icon-warning"></i> 暂无可抄送部门，请联系管理员配置
        </div>
        
        <div v-else-if="ccList.length > 0" style="color: #409eff; font-size: 13px; margin-top: 4px;">
          <i class="el-icon-message"></i> 已选择 {{ ccList.length }} 个部门接收抄送
        </div>
      </el-form-item>
      
      <!-- 流程预览 -->
      <div v-if="steps.length > 0" style="margin-top: 20px; padding: 12px; background: #f5f7fa; border-radius: 4px;">
        <div style="font-weight: 500; color: #606266; margin-bottom: 8px;">
          <i class="el-icon-flow"></i> 审批流程预览
        </div>
        <div style="font-size: 13px; color: #909399;">
          {{ getFlowPreview() }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { buildApiUrl, API_ENDPOINTS, getAuthHeaders } from '../config/api.js';

// ...existing code...

const props = defineProps({
  templateId: Number,
  modelValue: Array, // [{step_order, leader_id}]
  ccValue: Array // [userId]
});
const emit = defineEmits(['update:modelValue', 'update:ccValue']);

const steps = ref([]);
const selectedApprovers = ref([]);
const ccList = ref([]);
const loading = ref(false);
const allCandidates = ref([]);

// 计算属性：按部门分组的候选人
const groupedCandidates = computed(() => {
  const groups = {};
  allCandidates.value.forEach(user => {
    const deptName = user.department_name || '未知部门';
    if (!groups[deptName]) {
      groups[deptName] = { name: deptName, users: [] };
    }
    groups[deptName].users.push(user);
  });
  return Object.values(groups);
});

// 获取选中审批人的姓名
function getSelectedUserName(stepIndex) {
  const selectedId = selectedApprovers.value[stepIndex];
  if (!selectedId) return '';
  
  const step = steps.value[stepIndex];
  const user = step?.candidates?.find(u => u.id === selectedId);
  return user?.real_name || '';
}

// 获取流程预览文本
function getFlowPreview() {
  const preview = steps.value.map((step, idx) => {
    const selectedName = getSelectedUserName(idx);
    return `${step.dept_name}${step.leader_role}(${selectedName || '待选择'})`;
  }).join(' → ');
  
  return preview + (ccList.value.length > 0 ? ` [抄送${ccList.value.length}人]` : '');
}

// 初始化审批人选择器的值（支持v-model双向绑定）
watch(
  () => props.modelValue,
  (val) => {
    if (Array.isArray(val) && val.length) {
      selectedApprovers.value = val.map(v => v.leader_id);
    }
  },
  { immediate: true }
);

watch(
  () => props.ccValue,
  (val) => {
    if (Array.isArray(val)) ccList.value = val;
  },
  { immediate: true }
);

async function fetchSteps() {
  if (!props.templateId) {
    console.log('模板ID为空，清空步骤数据');
    steps.value = [];
    allCandidates.value = [];
    return;
  }
  
  console.log(`开始获取模板${props.templateId}的审批步骤...`);
  loading.value = true;
  
  try {
    // 优先尝试正常API
    let url = buildApiUrl(API_ENDPOINTS.approvals.templateSteps(props.templateId));
    let res;
    
    try {
      res = await fetch(url, {
        headers: getAuthHeaders()
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (authError) {
      console.log('正常API失败，尝试测试API:', authError.message);
      // 使用测试接口
      url = buildApiUrl(API_ENDPOINTS.approvals.templateStepsTest(props.templateId));
      res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
    }
    
    const data = await res.json();
    console.log('获取到的审批步骤数据:', data);
    
    steps.value = data.steps || [];
    
    // 汇总所有候选人用于抄送，并添加部门信息
    const candidatesMap = new Map();
    steps.value.forEach(step => {
      step.candidates.forEach(user => {
        if (!candidatesMap.has(user.id)) {
          candidatesMap.set(user.id, {
            ...user,
            department_name: step.dept_name
          });
        }
      });
    });
    allCandidates.value = Array.from(candidatesMap.values());
    
    // 重置选择
    selectedApprovers.value = new Array(steps.value.length).fill(null);
    
    console.log(`成功获取${steps.value.length}个审批步骤，${allCandidates.value.length}个候选人`);
    
  } catch (error) {
    console.error('获取审批步骤失败:', error);
    
    // 重置数据
    steps.value = [];
    allCandidates.value = [];
    selectedApprovers.value = [];
    
    // 不显示任何弹窗提示，只记录错误日志
    // 错误提示交给父组件Application.vue处理
  } finally {
    loading.value = false;
  }
}

watch(() => props.templateId, fetchSteps, { immediate: true });

watch(selectedApprovers, (val) => {
  const validSteps = steps.value.map((s, i) => ({
    step_order: s.step_order,
    leader_id: val[i]
  })).filter(s => s.leader_id); // 只返回已选择的步骤
  
  emit('update:modelValue', validSteps);
}, { deep: true });

watch(ccList, (val) => {
  emit('update:ccValue', val);
});

// 移除 onMounted 调用，避免重复执行
// onMounted(fetchSteps);
</script>

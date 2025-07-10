<template>
  <div class="settings-overlay" v-if="visible" @click="handleOverlayClick">
    <div class="settings-dialog" @click.stop>
      <div class="settings-header">
        <div class="settings-title">
          <span class="settings-icon">⚙️</span>
          <span>系统设置</span>
        </div>
        <el-button type="text" @click="closeDialog" class="close-btn">
          <span class="close-icon">✕</span>
        </el-button>
      </div>

      <div class="settings-content">
        <el-form :model="form" label-width="100px" size="large">
          <el-form-item label="后端地址">
            <el-input 
              v-model="form.host" 
              placeholder="例如: localhost 或 192.168.1.100"
              class="settings-input"
            >
              <template #prepend>http://</template>
            </el-input>
          </el-form-item>
          
          <el-form-item label="端口号">
            <el-input 
              v-model="form.port" 
              placeholder="例如: 3001"
              class="settings-input"
              type="number"
            >
              <template #append>:端口</template>
            </el-input>
          </el-form-item>

          <div class="preview-section">
            <div class="preview-label">预览地址:</div>
            <div class="preview-url">{{ previewUrl }}</div>
          </div>
        </el-form>
      </div>

      <div class="settings-footer">
        <el-button @click="resetSettings" class="reset-btn">
          <span class="reset-icon">🔄</span>
          重置默认
        </el-button>
        <div class="action-buttons">
          <el-button @click="closeDialog" size="large">取消</el-button>
          <el-button type="primary" @click="saveSettings" size="large">
            <span class="check-icon">✓</span>
            保存设置
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { SETTINGS } from '../config/api.js';

const props = defineProps({
  visible: Boolean
});

const emit = defineEmits(['update:visible']);

const form = ref({
  host: 'localhost',
  port: '3001'
});

// 预览URL
const previewUrl = computed(() => {
  if (!form.value.host || !form.value.port) return '请输入完整信息';
  return `http://${form.value.host}:${form.value.port}`;
});

// 初始化表单
function initForm() {
  const settings = SETTINGS.get();
  form.value = { ...settings };
}

// 保存设置
function saveSettings() {
  if (!form.value.host || !form.value.port) {
    ElMessage.warning('请输入完整的地址和端口');
    return;
  }

  try {
    SETTINGS.save(form.value);
    ElMessage.success('设置保存成功！重新登录后生效');
    closeDialog();
  } catch (error) {
    ElMessage.error('保存设置失败');
    console.error('保存设置失败:', error);
  }
}

// 重置设置
function resetSettings() {
  SETTINGS.reset();
  initForm();
  ElMessage.info('设置已重置为默认值');
}

// 关闭对话框
function closeDialog() {
  emit('update:visible', false);
}

// 点击遮罩关闭
function handleOverlayClick() {
  closeDialog();
}

// 监听visible变化，初始化表单
watch(() => props.visible, (newVal) => {
  if (newVal) {
    initForm();
  }
}, { immediate: true });
</script>

<style scoped>
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.settings-dialog {
  background: white;
  border-radius: 12px;
  width: 480px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.settings-header {
  background: linear-gradient(135deg, #409EFF 0%, #67C23A 100%);
  color: white;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.settings-title {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
}

.settings-icon {
  margin-right: 8px;
  font-size: 18px;
}

.close-icon {
  font-size: 16px;
  font-weight: bold;
}

.reset-icon {
  margin-right: 4px;
  font-size: 14px;
}

.check-icon {
  margin-right: 4px;
  font-size: 14px;
  font-weight: bold;
}

.close-btn {
  color: white !important;
  border: none !important;
  padding: 4px !important;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: rgba(255, 255, 255, 0.2) !important;
}

.settings-content {
  padding: 32px 24px 24px;
}

.settings-input {
  width: 100%;
}

.settings-input :deep(.el-input-group__prepend),
.settings-input :deep(.el-input-group__append) {
  background: #f5f7fa;
  color: #909399;
  border-color: #dcdfe6;
}

.preview-section {
  margin-top: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #409EFF;
}

.preview-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: 500;
}

.preview-url {
  font-size: 16px;
  color: #409EFF;
  font-family: 'Monaco', 'Menlo', monospace;
  word-break: break-all;
}

.settings-footer {
  padding: 20px 24px;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid #ebeef5;
}

.reset-btn {
  color: #909399;
  border-color: #dcdfe6;
}

.reset-btn:hover {
  color: #409EFF;
  border-color: #409EFF;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.action-buttons .el-button {
  min-width: 80px;
}
</style>

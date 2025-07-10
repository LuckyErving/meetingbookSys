<template>
  <div class="approval-flow">
    <div class="approval-step" v-for="(step, idx) in steps" :key="idx">
      <div :class="['circle', step.status]">
        <el-icon v-if="step.status==='done'" color="#67C23A"><i class="el-icon-check"></i></el-icon>
        <el-icon v-else-if="step.status==='reject'" color="#F56C6C"><i class="el-icon-close"></i></el-icon>
        <span v-else>{{ idx+1 }}</span>
      </div>
      <div class="step-info">
        <div class="step-title">{{ step.dept }}<span v-if="step.leader"> · {{ step.leader }}</span></div>
        <div class="step-status">
          <span v-if="step.status==='done'">已通过</span>
          <span v-else-if="step.status==='pending'">待审批</span>
          <span v-else-if="step.status==='reject'">已拒绝</span>
        </div>
      </div>
      <div v-if="idx < steps.length-1" class="step-line"></div>
    </div>
  </div>
</template>

<script setup>
// props: steps: [{ dept, leader, status: 'done'|'pending'|'reject' }]
const props = defineProps({
  steps: {
    type: Array,
    required: true
  }
});
</script>

<style scoped>
.approval-flow {
  display: flex;
  align-items: flex-start;
  padding: 18px 0 8px 0;
}
.approval-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  min-width: 90px;
}
.circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e0e7ff;
  color: #409EFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
  margin-bottom: 6px;
  border: 2px solid #b3c6ff;
}
.circle.done {
  background: #f0fdfa;
  border-color: #67C23A;
  color: #67C23A;
}
.circle.reject {
  background: #fff0f0;
  border-color: #F56C6C;
  color: #F56C6C;
}
.circle.pending {
  background: #e0e7ff;
  border-color: #b3c6ff;
  color: #409EFF;
}
.step-info {
  text-align: center;
  font-size: 14px;
  color: #333;
}
.step-title {
  font-weight: 500;
  margin-bottom: 2px;
}
.step-status {
  font-size: 13px;
  color: #888;
}
.step-line {
  width: 2px;
  height: 32px;
  background: linear-gradient(to bottom, #b3c6ff 60%, #e0e7ff 100%);
  margin: 2px 0 0 0;
}
</style>

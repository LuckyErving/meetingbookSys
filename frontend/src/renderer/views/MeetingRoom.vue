<template>
  <div class="room-bg">
    <el-card class="room-card">
      <div class="room-title">
        <img src="https://img.icons8.com/ios-filled/50/409eff/meeting-room.png" class="room-logo" />
        <span>会议室列表</span>
      </div>
      <el-divider />
      <el-table :data="rooms" class="room-table" stripe :border="false">
        <el-table-column prop="name" label="会议室名称" min-width="120" />
        <el-table-column prop="location" label="位置" min-width="120" />
        <el-table-column prop="capacity" label="容量" min-width="80" />
        <el-table-column prop="description" label="描述" min-width="180" />
        <el-table-column label="操作" min-width="100">
          <template #default="scope">
            <el-button size="small" type="primary" plain @click="viewSeats(scope.row)">座位图</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-dialog v-model="seatDialog" title="座位指引图" width="600px" :close-on-click-modal="true">
        <div v-if="selectedRoom">
          <pre class="seat-layout">{{ selectedRoom.seat_layout }}</pre>
        </div>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS, getAuthHeaders } from '../config/api.js';

const rooms = ref([]);
const seatDialog = ref(false);
const selectedRoom = ref(null);

onMounted(async () => {
  const res = await axios.get(buildApiUrl(API_ENDPOINTS.rooms.list), getAuthHeaders());
  rooms.value = res.data;
});

function viewSeats(room) {
  selectedRoom.value = room;
  seatDialog.value = true;
}
</script>

<style scoped>
.room-bg {
  min-height: 100vh;
  background: linear-gradient(135deg, #e0e7ff 0%, #f0fdfa 100%);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 40px;
}
.room-card {
  width: 100%;
  max-width: 1000px;
  border-radius: 18px;
  box-shadow: 0 8px 32px 0 rgba(64,158,255,0.10);
  padding: 32px 32px 18px 32px;
  border: none !important;
  background: rgba(255,255,255,0.85);
  /* 进一步降低白色不透明度，去除割裂感 */
  box-shadow: 0 8px 32px 0 rgba(64,158,255,0.08);
}
.room-title {
  display: flex;
  align-items: center;
  font-size: 22px;
  font-weight: 600;
  color: #409EFF;
  margin-bottom: 18px;
  letter-spacing: 2px;
}
.room-logo {
  width: 36px;
  height: 36px;
  margin-right: 10px;
}
.room-table {
  margin-bottom: 18px;
  border-radius: 10px;
  overflow: hidden;
  background: transparent !important;
  /* 表格背景透明，去除边框 */
  --el-table-border-color: transparent;
  --el-table-header-bg-color: transparent;
  --el-table-row-hover-bg-color: #f4f8ff;
}
.seat-layout {
  background: #f6f8fa;
  border-radius: 8px;
  padding: 16px;
  font-size: 15px;
  color: #333;
}
</style>

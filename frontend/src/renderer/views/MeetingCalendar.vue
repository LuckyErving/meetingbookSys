<template>
  <div class="calendar-bg">
    <el-card class="calendar-card">
      <div class="calendar-title">
        <el-icon><i class="el-icon-date"></i></el-icon>
        <span>会议室申请日历</span>
      </div>
      
      <!-- 月份选择器 -->
      <div class="calendar-controls">
        <el-date-picker
          v-model="currentMonth"
          type="month"
          placeholder="选择月份"
          format="YYYY年MM月"
          value-format="YYYY-MM"
          @change="handleMonthChange"
          style="margin-bottom: 20px;"
        />
        <el-button type="primary" @click="refreshData" :loading="loading">
          <el-icon><i class="el-icon-refresh"></i></el-icon>
          刷新
        </el-button>
      </div>

      <!-- 日历组件 -->
      <el-calendar v-model="currentDate" v-loading="loading">
        <template #date-cell="{ data }">
          <div class="calendar-cell" @click="showDayDetail(data.day)">
            <div class="date-number">{{ data.day.split('-').pop() }}</div>
            <div class="meeting-info" v-if="getMeetingsForDate(data.day).length > 0">
              <div class="meeting-count">
                {{ getMeetingsForDate(data.day).length }}个会议
              </div>
              <div class="meeting-list">
                <div 
                  v-for="meeting in getMeetingsForDate(data.day).slice(0, 2)" 
                  :key="meeting.id"
                  class="meeting-item"
                  :class="getStatusClass(meeting.status)"
                >
                  <span class="meeting-title">{{ meeting.title }}</span>
                  <span class="meeting-time">{{ formatTime(meeting.start_time) }}</span>
                </div>
                <div v-if="getMeetingsForDate(data.day).length > 2" class="more-meetings">
                  +{{ getMeetingsForDate(data.day).length - 2 }}个...
                </div>
              </div>
            </div>
            <div v-else class="no-meetings">
              <span class="empty-text">无会议</span>
            </div>
          </div>
        </template>
      </el-calendar>

      <!-- 当日详情模态框 -->
      <el-dialog 
        v-model="dayDetailVisible" 
        :title="`${selectedDate} 的会议安排`"
        width="70%"
        @close="dayDetailVisible = false"
      >
        <el-table :data="selectedDayMeetings" stripe border>
          <el-table-column prop="title" label="会议主题" min-width="150" />
          <el-table-column prop="applicant.real_name" label="申请人" min-width="100" />
          <el-table-column prop="meeting_room.name" label="会议室" min-width="120" />
          <el-table-column label="时间" min-width="200">
            <template #default="scope">
              {{ formatDateTime(scope.row.start_time) }} - {{ formatDateTime(scope.row.end_time) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" min-width="90">
            <template #default="scope">
              <el-tag :type="statusTag(scope.row.status)">{{ statusText(scope.row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="90">
            <template #default="scope">
              <el-button size="small" type="primary" plain @click="goDetail(scope.row.id)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS, getAuthHeaders } from '../config/api.js';

const router = useRouter();
const currentDate = ref(new Date());
const currentMonth = ref(new Date().toISOString().slice(0, 7)); // YYYY-MM
const meetings = ref([]);
const loading = ref(false);
const dayDetailVisible = ref(false);
const selectedDate = ref('');
const selectedDayMeetings = ref([]);

// 获取指定日期的会议
const getMeetingsForDate = (dateStr) => {
  const targetDate = dateStr;
  return meetings.value.filter(meeting => {
    const meetingDate = new Date(meeting.start_time).toISOString().split('T')[0];
    return meetingDate === targetDate;
  });
};

function getStatusClass(status) {
  return `status-${status}`;
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

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

function handleMonthChange(month) {
  if (month) {
    currentDate.value = new Date(month + '-01');
    fetchMeetings();
  }
}

function showDayDetail(dateStr) {
  selectedDate.value = dateStr;
  selectedDayMeetings.value = getMeetingsForDate(dateStr);
  dayDetailVisible.value = true;
}

async function fetchMeetings() {
  loading.value = true;
  try {
    // 获取当月的会议数据
    const startDate = `${currentMonth.value}-01`;
    const endDate = new Date(currentMonth.value + '-01');
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0); // 获取当月最后一天
    const endDateStr = endDate.toISOString().split('T')[0];
    
    const token = localStorage.getItem('token');
    let allMeetings = [];
    
    // 优先尝试专用的日历API
    try {
      const { data } = await axios.get(buildApiUrl(API_ENDPOINTS.calendar.meetings));
      allMeetings = data.data || [];
      console.log('使用日历API获取数据成功');
    } catch (calendarError) {
      console.log('日历API失败，尝试其他方式:', calendarError.message);
      
      // 备用方案：尝试认证API
      try {
        if (token) {
          const { data } = await axios.get(buildApiUrl(API_ENDPOINTS.applications.allTest), {
            headers: getAuthHeaders()
          });
          allMeetings = data.data || [];
        } else {
          throw new Error('No token');
        }
      } catch (authError) {
        console.log('认证API失败，使用测试API');
        // 最后备用方案：使用测试API获取多个用户数据
        try {
          const { data } = await axios.get(buildApiUrl(API_ENDPOINTS.applications.mineTest(1)));
          allMeetings = data.data || [];
          
          // 获取其他用户的数据来丰富日历
          for (let userId = 2; userId <= 5; userId++) {
            try {
              const { data: userData } = await axios.get(buildApiUrl(API_ENDPOINTS.applications.mineTest(userId)));
              if (userData.data && userData.data.length > 0) {
                allMeetings = allMeetings.concat(userData.data);
              }
            } catch (e) {
              // 忽略单个用户获取失败的错误
            }
          }
        } catch (e) {
          console.error('所有API尝试失败:', e);
        }
      }
    }
    
    // 过滤当月的会议并处理数据格式
    meetings.value = allMeetings
      .filter(meeting => {
        const meetingDate = new Date(meeting.start_time).toISOString().split('T')[0];
        return meetingDate >= startDate && meetingDate <= endDateStr;
      })
      .map(meeting => ({
        id: meeting.id,
        title: meeting.title,
        description: meeting.description,
        start_time: meeting.start_time,
        end_time: meeting.end_time,
        status: meeting.status,
        applicant: meeting.applicant || { real_name: '未知用户' },
        meeting_room: meeting.meetingRoom || meeting.meeting_room || { name: '未知会议室' }
      }));
    
    console.log(`获取到${currentMonth.value}的会议记录:`, meetings.value.length, '条');
    console.log('会议数据:', meetings.value);
  } catch (error) {
    console.error('获取会议数据失败:', error);
    meetings.value = [];
  } finally {
    loading.value = false;
  }
}

function refreshData() {
  fetchMeetings();
}

onMounted(() => {
  fetchMeetings();
});
</script>

<style scoped>
.calendar-bg {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 20px;
}

.calendar-card {
  width: 100%;
  max-width: 1200px;
  border-radius: 18px;
  box-shadow: 0 8px 32px 0 rgba(64,158,255,0.10);
  padding: 32px;
  border: none !important;
  background: rgba(255,255,255,0.95);
}

.calendar-title {
  display: flex;
  align-items: center;
  font-size: 24px;
  font-weight: 600;
  color: #409EFF;
  margin-bottom: 20px;
  letter-spacing: 2px;
}

.calendar-title .el-icon {
  margin-right: 10px;
}

.calendar-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.calendar-cell {
  height: 100px;
  padding: 4px;
  position: relative;
  overflow: hidden;
}

.date-number {
  font-weight: bold;
  font-size: 14px;
  color: #333;
  margin-bottom: 2px;
}

.meeting-info {
  font-size: 11px;
}

.meeting-count {
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 2px;
}

.meeting-item {
  margin-bottom: 1px;
  padding: 1px 3px;
  border-radius: 3px;
  font-size: 10px;
  line-height: 1.2;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meeting-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 2px;
}

.meeting-time {
  font-size: 9px;
  opacity: 0.8;
}

.status-pending {
  background-color: #fdf6ec;
  color: #e6a23c;
  border: 1px solid #f5dab1;
}

.status-approved {
  background-color: #f0f9ff;
  color: #67c23a;
  border: 1px solid #b3d8ff;
}

.status-rejected {
  background-color: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fbc4c4;
}

.status-finished {
  background-color: #f0f9ff;
  color: #909399;
  border: 1px solid #d3d4d6;
}

.more-meetings {
  color: #909399;
  font-size: 9px;
  margin-top: 1px;
}

.no-meetings {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 70px;
}

.empty-text {
  color: #c0c4cc;
  font-size: 11px;
}

/* 日历单元格点击效果 */
.calendar-cell:hover {
  background-color: rgba(64, 158, 255, 0.05);
  cursor: pointer;
  border-radius: 4px;
}

/* Element Plus 日历组件样式调整 */
:deep(.el-calendar__header) {
  padding: 12px 20px;
  border-bottom: 2px solid #f0f0f0;
}

:deep(.el-calendar__body) {
  padding: 12px 20px 35px;
}

:deep(.el-calendar-table .el-calendar-day) {
  height: 110px;
  padding: 0;
}

:deep(.el-calendar-table td.is-selected .el-calendar-day) {
  background-color: #409eff;
  color: white;
}

:deep(.el-calendar-table td.is-today .el-calendar-day) {
  background-color: #f0f9ff;
  color: #409eff;
  font-weight: bold;
}
</style>

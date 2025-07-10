<template>
  <div class="home-bg">
    <el-card class="home-card">
      <div class="home-title">
        <img src="https://img.icons8.com/ios-filled/50/409eff/conference-call.png" class="home-logo" />
        <span>欢迎使用会议室预订系统</span>
      </div>
      <el-divider />
      <div class="home-desc">
        <p>本系统支持会议室在线预订、审批、座位指引、抄送提醒等功能，助力高效会议管理。</p>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-card shadow="hover" class="home-feature-card">
              <div class="feature-title"><el-icon><i class="el-icon-office-building"></i></el-icon> 会议室信息与座位图</div>
              <div class="feature-desc">在线浏览会议室信息、座位布局，实时查看状态。</div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="hover" class="home-feature-card">
              <div class="feature-title"><el-icon><i class="el-icon-document-add"></i></el-icon> 一键申请与审批流</div>
              <div class="feature-desc">一键申请会议室，自动流转多级审批，进度透明。</div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="hover" class="home-feature-card">
              <div class="feature-title"><el-icon><i class="el-icon-message"></i></el-icon> 通知与抄送</div>
              <div class="feature-desc">支持多部门抄送与系统通知，消息及时送达。</div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="hover" class="home-feature-card">
              <div class="feature-title"><el-icon><i class="el-icon-data-analysis"></i></el-icon> 会议统计与管控</div>
              <div class="feature-desc">会议室状态实时管控，支持统计与导出。</div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>



<style scoped>
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}
.logo {
  font-size: 22px;
  font-weight: bold;
  color: #409EFF;
  letter-spacing: 2px;
  margin-left: 12px;
}
.nav-menu {
  background: transparent;
  border-bottom: none;
  box-shadow: none;
}
.home-bg {
  min-height: 100vh;
  background: linear-gradient(135deg, #e0e7ff 0%, #f0fdfa 100%);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 40px;
}
.home-card {
  width: 100%;
  max-width: 900px;
  border-radius: 18px;
  box-shadow: 0 8px 32px 0 rgba(64,158,255,0.10);
  padding: 32px 32px 18px 32px;
  border: none !important;
  background: rgba(255,255,255,0.88);
}
.home-title {
  display: flex;
  align-items: center;
  font-size: 22px;
  font-weight: 600;
  color: #409EFF;
  margin-bottom: 18px;
  letter-spacing: 2px;
}
.home-logo {
  width: 36px;
  height: 36px;
  margin-right: 10px;
}
.home-desc {
  margin-top: 18px;
}
.home-feature-card {
  margin-bottom: 18px;
  border-radius: 12px;
  min-height: 120px;
  border: none !important;
  background: transparent !important;
}
.feature-title {
  font-size: 16px;
  font-weight: 500;
  color: #409EFF;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}
.feature-title .el-icon {
  margin-right: 6px;
}
.feature-desc {
  color: #555;
  font-size: 14px;
}
</style>

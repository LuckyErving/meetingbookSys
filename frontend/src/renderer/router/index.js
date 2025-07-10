import MyApprovals from '../views/MyApprovals.vue';
import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import MeetingRoom from '../views/MeetingRoom.vue';
import Application from '../views/Application.vue';
import ApplicationDetail from '../views/ApplicationDetail.vue';
import MyApplications from '../views/MyApplications.vue';
import MeetingCalendar from '../views/MeetingCalendar.vue';

import Forgot from '../views/Forgot.vue';
const routes = [
  { path: '/', component: Home },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/forgot', component: Forgot },
  { path: '/rooms', component: MeetingRoom },
  { path: '/apply', component: Application },
  { path: '/application/:id', component: ApplicationDetail },
  { path: '/my-applications', component: MyApplications },
  { path: '/my-approvals', component: MyApprovals },
  { path: '/calendar', component: MeetingCalendar }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;


import { createRouter, createWebHashHistory } from 'vue-router'
import Login from '../views/login/index.vue'

const routes = [
  { path: '/login', component: Login },
  {
    path: '/',
    component: () => import('../layout/index.vue'),
    redirect: '/',
    children: [
      { path: '/', component: () => import('../views/dashboard/index.vue') },
      { path: '/organization/department', component: () => import('../views/organization/department.vue') },
      {
        path: '/organization/staffPosition',
        component: () => import('../views/organization/staffPosition.vue')
      },
      {
        path: '/vehicle/info',
        component: () => import('../views/vehicle/info.vue')
      },
      {
        path: '/dormitory/info',
        component: () => import('../views/dormitory/info.vue')
      },
      {
        path: '/hr/employeesInfo',
        component: () => import('../views/hr/employeesInfo.vue')
      },
      //入职审批路由
      {
        path: '/hr/onboarding',
        component: () => import('../views/hr/onboarding.vue')
      },
      //离职审批路由
      {
        path: '/hr/offboarding',
        component: () => import('../views/hr/offboarding.vue')
      },
      //离职人员名单路由
      {
        path: '/hr/resignedList',
        component: () => import('../views/hr/resignedList.vue')
      },
      {
        path: '/profile',
        component: () => import('../views/profile.vue')
      },
      {
        path: '/settings',
        component: () => import('../views/settings.vue')
      },
      { path: '/mobile/signin', component: () => import('../views/mobile/signin.vue') },
      { path: '/mobile/functions', component: () => import('../views/mobile/functions.vue') },
      { path: '/mobile/notifications', component: () => import('../views/mobile/notifications.vue') },
      {
        path: '/mobile/addressList',
        component: () => import('../views/mobile/addressList.vue')
      },
      {
        path: '/mobile/employee/:id',
        component: () => import('../views/mobile/employeeDetail.vue')
      },
      { path: '/scores/myscore', component: () => import('../views/scores/myscore.vue') },
      { path: '/scores/lottery', component: () => import('../views/scores/lottery.vue') },
      { path: '/salaries/salary', component: () => import('../views/salaries/salary.vue') },
      { path: '/salaries/salaryPayment', component: () => import('../views/salaries/salaryPayment.vue') },
      { path: '/salaries/mysalary', component: () => import('../views/salaries/mysalary.vue') },
      { path: '/attendance/scheduling', component: () => import('../views/attendance/scheduling.vue') },
      { path: '/attendance/schedulingOperation', component: () => import('../views/attendance/schedulingOperation.vue') },
      { path: '/attendance/shifts', component: () => import('../views/attendance/shifts.vue') },
      { path: '/attendance/scheduledetails', component: () => import('../views/attendance/scheduledetails.vue') },
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach((to, _, next) => {
  const token = localStorage.getItem('token')
  // 移动端签到页面和登录页面不需要 token
  if (to.path !== '/login' && to.path !== '/mobile/signin' && !token) next('/login')
  else next()
})

export default router

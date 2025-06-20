import { createRouter, createWebHistory } from 'vue-router'
// 路由配置
const routes = [
  {
    path: '/',
    component: () => import('@/layout/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '数据总览', icon: 'DataLine' },
      },
      {
        path: 'product',
        name: 'Product',
        component: () => import('@/views/product/index.vue'),
        meta: { title: '商品管理', icon: 'shopping' },
      },
      {
        path: 'category',
        name: 'Category',
        component: () => import('@/views/category/index.vue'),
        meta: { title: '分类管理', icon: 'FolderOpened' },
      },
      {
        path: 'product-review',
        name: 'ProductReview',
        component: () => import('@/views/product-review/index.vue'),
        meta: { title: '商品审核', icon: 'Check' },
      },
      {
        path: 'order',
        name: 'Order',
        component: () => import('@/views/order/index.vue'),
        meta: { title: '订单管理', icon: 'order' },
      },
      {
        path: 'refund',
        name: 'Refund',
        component: () => import('@/views/refund/index.vue'),
        meta: { title: '退款处理', icon: 'RefreshRight' },
      },
      {
        path: 'message',
        name: 'Message',
        component: () => import('@/views/message/index.vue'),
        meta: { title: '消息中心', icon: 'Message' },
      },
      {
        path: 'user',
        name: 'User',
        component: () => import('@/views/user/index.vue'),
        meta: { title: '用户管理', icon: 'user' },
      },
      {
        path: 'credit',
        name: 'Credit',
        component: () => import('@/views/credit/index.vue'),
        meta: { title: '信用体系', icon: 'Medal' },
      },
      {
        path: 'setting',
        name: 'Setting',
        component: () => import('@/views/setting/index.vue'),
        meta: { title: '系统设置', icon: 'setting' },
      },
    ],
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router

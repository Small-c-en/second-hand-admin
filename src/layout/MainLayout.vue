<!-- 主布局组件 -->
<template>
  <div class="app-wrapper">
    <!-- 侧边栏 -->
    <div class="sidebar-container" :class="{ 'is-collapse': isCollapse }">
      <div class="logo-container">
        <img src="@/assets/logo.svg" alt="logo" class="logo-image" />
        <span v-show="!isCollapse" class="logo-text">二手交易管理系统</span>
      </div>
      <!-- 菜单组件 -->
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        background-color="#FFFFFF"
        text-color="#2C3E50"
        active-text-color="#FFFFFF"
        :collapse-transition="false"
        class="sidebar-menu"
        router
      >
        <template v-for="route in routes" :key="route.path">
          <el-menu-item v-if="!route.children" :index="route.path">
            <el-icon size="18"><component :is="route.meta?.icon" /></el-icon>
            <template #title>{{ route.meta?.title }}</template>
          </el-menu-item>

          <el-sub-menu v-else :index="route.path">
            <template #title>
              <el-icon size="18"><component :is="route.meta?.icon" /></el-icon>
              <span>{{ route.meta?.title }}</span>
            </template>
            <el-menu-item
              v-for="child in route.children"
              :key="child.path"
              :index="route.path + '/' + child.path"
            >
              <template #title>{{ child.meta?.title }}</template>
            </el-menu-item>
          </el-sub-menu>
        </template>
      </el-menu>
    </div>

    <!-- 主容器 -->
    <div class="main-container">
      <!-- 头部导航 -->
      <div class="navbar">
        <div class="left-area">
          <el-button type="text" @click="toggleSidebar" class="hamburger-btn">
            <el-icon :size="20"><Fold v-if="!isCollapse" /><Expand v-else /></el-icon>
          </el-button>
          <breadcrumb />
        </div>
        <div class="right-area">
          <el-dropdown trigger="click">
            <div class="avatar-wrapper">
              <el-avatar :size="32" :src="userInfo.avatar" />
              <span class="username">{{ userInfo.name }}</span>
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleCommand('profile')">
                  <el-icon><user /></el-icon>
                  <span>个人信息</span>
                </el-dropdown-item>
                <el-dropdown-item @click="handleCommand('logout')">
                  <el-icon><switch-button /></el-icon>
                  <span>退出登录</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- 主内容区 -->
      <div class="app-main">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Fold, Expand, User, SwitchButton, ArrowDown } from '@element-plus/icons-vue'
import Breadcrumb from '@/components/Breadcrumb.vue'

// 路由实例
const router = useRouter()
const route = useRoute()

// 侧边栏折叠状态
const isCollapse = ref(false)

// 用户信息
const userInfo = ref({
  name: 'Admin',
  avatar: 'https://placeholder.com/32x32',
})

// 计算当前激活的菜单
const activeMenu = computed(() => route.path)

// 获取路由配置
const routes = computed(() => {
  return router.options.routes[0].children || []
})

// 切换侧边栏
const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}

// 处理下拉菜单命令
const handleCommand = (command) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'logout':
      // TODO: 实现登出逻辑
      router.push('/login')
      break
  }
}
</script>

<style scoped>
.app-wrapper {
  display: flex;
  width: 100%;
  height: 100vh;
}

.sidebar-container {
  width: 240px;
  height: 100%;
  background-color: #ffffff;
  transition: width 0.3s;
  overflow: hidden;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

.sidebar-container.is-collapse {
  width: 64px;

  .logo-container {
    padding: 10px 12px;
    justify-content: center;

    .logo-image {
      margin: 0;
    }
  }
}

.logo-container {
  height: 64px;
  padding: 10px 20px;
  display: flex;
  align-items: center;
  background-color: #ffffff;
  border-bottom: 1px solid #f0f0f0;
}

.logo-image {
  width: 40px;
  height: 40px;
  margin-right: 10px;
}

.logo-text {
  color: #2c3e50;
  font-size: 16px;
  font-weight: bold;
  white-space: nowrap;
}

.sidebar-menu {
  border-right: none;
  padding: 12px;
}

.sidebar-menu :deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
  margin: 4px 0;
  padding: 0 16px !important;
  border-radius: 8px;

  &.is-active {
    background-color: #ff6f00 !important;
    color: #ffffff !important;
    border-right: none;

    .el-icon {
      color: #ffffff !important;
    }
  }

  &:hover {
    background-color: #fff3e0;
    color: #ff6f00;

    .el-icon {
      color: #ff6f00;
    }
  }

  .el-icon {
    width: 24px;
    height: 24px;
    margin-right: 12px;
    vertical-align: middle;
  }
}

.sidebar-menu :deep(.el-sub-menu) {
  .el-sub-menu__title {
    height: 50px;
    line-height: 50px;
    margin: 4px 0;
    padding: 0 16px !important;
    border-radius: 8px;

    &:hover {
      background-color: #fff3e0;
      color: #ff6f00;

      .el-icon {
        color: #ff6f00;
      }
    }

    .el-icon {
      width: 24px;
      height: 24px;
      margin-right: 12px;
      vertical-align: middle;
    }
  }

  .el-menu {
    padding: 0 4px;
    background-color: transparent;

    .el-menu-item {
      padding-left: 48px !important;
      margin: 4px 0;
      min-width: auto;
    }
  }
}

.sidebar-menu :deep(.el-sub-menu.is-active) {
  .el-sub-menu__title {
    color: #ff6f00;

    .el-icon {
      color: #ff6f00;
    }
  }
}

/* 折叠状态下的样式 */
.sidebar-menu.el-menu--collapse {
  width: 64px;
  padding: 12px 8px;

  .el-menu-item,
  .el-sub-menu__title {
    padding: 0 20px !important;
  }

  .el-menu-item {
    .el-icon {
      margin: 0;
    }
  }

  .el-sub-menu__title {
    .el-icon {
      margin: 0;
    }
  }

  .el-tooltip__trigger:hover {
    background-color: #fff3e0;
    color: #ff6f00;
    border-radius: 8px;

    .el-icon {
      color: #ff6f00;
    }
  }
}

/* 确保折叠时子菜单弹出样式正确 */
:deep(.el-menu--popup) {
  padding: 8px;
  min-width: 180px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

  .el-menu-item {
    height: 40px;
    line-height: 40px;
    margin: 4px 0;
    padding: 0 16px !important;
    border-radius: 6px;

    &.is-active {
      background-color: #ff6f00 !important;
      color: #ffffff !important;
    }

    &:hover {
      background-color: #fff3e0;
      color: #ff6f00;
    }
  }
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.navbar {
  height: 64px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
}

.left-area {
  display: flex;
  align-items: center;
}

.hamburger-btn {
  padding: 0;
  margin-right: 20px;
  color: #2c3e50;

  &:hover {
    color: #ff6f00;
  }

  .el-icon {
    vertical-align: middle;
  }
}

.right-area {
  display: flex;
  align-items: center;
}

.avatar-wrapper {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 5px 8px;
  border-radius: 4px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #f8f9fa;
  }
}

.username {
  margin: 0 8px;
  font-size: 14px;
  color: #2c3e50;
}

.app-main {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #f0f2f5;
}

/* 路由切换动画 */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;

  .el-icon {
    margin-right: 4px;
  }
}
</style>

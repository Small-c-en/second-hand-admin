<!-- 数据总览页面 -->
<template>
  <div class="dashboard-container">
    <!-- 统计卡片区域 -->
    <el-row :gutter="24">
      <el-col :span="8" v-for="(item, index) in statisticsData" :key="index">
        <el-card class="statistics-card" shadow="hover">
          <div class="card-header">
            <span class="card-title">{{ item.title }}</span>
            <el-tooltip :content="item.tip" placement="top">
              <el-icon><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
          <div class="card-content">
            <span class="main-value">{{ item.value }}</span>
            <div class="trend-info" :class="item.trend > 0 ? 'up' : 'down'">
              <el-icon><component :is="item.trend > 0 ? 'ArrowUp' : 'ArrowDown'" /></el-icon>
              <span>{{ Math.abs(item.trend) }}%</span>
            </div>
          </div>
          <div class="card-footer">
            <span class="label">对比昨日</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="24" class="chart-row">
      <!-- 交易趋势图 -->
      <el-col :span="16">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="chart-header">
              <span>近7日交易趋势</span>
              <el-radio-group v-model="timeRange" size="small">
                <el-radio-button label="week">7天</el-radio-button>
                <el-radio-button label="month">30天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-container">
            <LineChart :data="transactionData" />
          </div>
        </el-card>
      </el-col>

      <!-- 商品分类占比图 -->
      <el-col :span="8">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="chart-header">
              <span>商品分类占比</span>
            </div>
          </template>
          <div class="chart-container">
            <PieChart :data="categoryData" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷操作区域 -->
    <el-row :gutter="24" class="shortcut-row">
      <el-col :span="6" v-for="(action, index) in quickActions" :key="index">
        <el-card class="shortcut-card" shadow="hover" @click="handleQuickAction(action)">
          <div class="shortcut-content">
            <el-badge :value="action.badge" :type="action.badgeType">
              <el-icon :size="24"><component :is="action.icon" /></el-icon>
            </el-badge>
            <div class="action-info">
              <span class="action-title">{{ action.title }}</span>
              <span class="action-desc">{{ action.description }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  QuestionFilled,
  ArrowUp,
  ArrowDown,
  Document,
  Warning,
  ChatDotRound,
  Download,
} from '@element-plus/icons-vue'
import LineChart from './components/LineChart.vue'
import PieChart from './components/PieChart.vue'

const router = useRouter()

// 统计数据
const statisticsData = ref([
  {
    title: '今日交易额',
    value: '¥128,000',
    trend: 15,
    tip: '截至今日的总交易金额',
  },
  {
    title: '订单总数',
    value: '1,234',
    trend: -8,
    tip: '今日订单总量',
  },
  {
    title: '新增用户',
    value: '456',
    trend: 12,
    tip: '今日新注册用户数',
  },
])

// 时间范围选择
const timeRange = ref('week')

// 交易数据
const transactionData = ref({
  dates: ['06-01', '06-02', '06-03', '06-04', '06-05', '06-06', '06-07'],
  values: [30000, 28000, 35000, 32000, 40000, 42000, 38000],
})

// 分类数据
const categoryData = ref([
  { name: '电子产品', value: 35 },
  { name: '服饰', value: 25 },
  { name: '家居', value: 20 },
  { name: '其他', value: 20 },
])

// 快捷操作
const quickActions = ref([
  {
    title: '新商品审核',
    description: '待审核商品：20',
    icon: Document,
    badge: 20,
    badgeType: 'danger',
    path: '/product',
  },
  {
    title: '异常订单处理',
    description: '异常订单：5',
    icon: Warning,
    badge: 5,
    badgeType: 'warning',
    path: '/order',
  },
  {
    title: '用户反馈',
    description: '未回复：8',
    icon: ChatDotRound,
    badge: 8,
    badgeType: 'info',
    path: '/feedback',
  },
  {
    title: '数据导出',
    description: '导出今日数据',
    icon: Download,
    path: '/export',
  },
])

// 处理快捷操作点击
const handleQuickAction = (action) => {
  router.push(action.path)
}
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 84px);
}

.statistics-card {
  margin-bottom: 24px;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  .el-icon {
    font-size: 16px;
    color: #909399;
    cursor: help;
  }
}

.card-title {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.card-content {
  display: flex;
  align-items: baseline;
  margin-bottom: 16px;
}

.main-value {
  font-size: 36px;
  font-weight: bold;
  color: #303133;
  margin-right: 16px;
  line-height: 1;
}

.trend-info {
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  line-height: 1;
  padding: 4px 8px;
  border-radius: 4px;

  .el-icon {
    width: 14px;
    height: 14px;
    margin-right: 4px;
  }

  &.up {
    color: #67c23a;
    background-color: #f0f9eb;

    .el-icon {
      color: #67c23a;
    }
  }

  &.down {
    color: #f56c6c;
    background-color: #fef0f0;

    .el-icon {
      color: #f56c6c;
    }
  }
}

.card-footer {
  font-size: 12px;
  color: #909399;
}

.chart-row {
  margin-bottom: 24px;
}

.chart-card {
  height: 480px;

  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid #ebeef5;
  }
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  span {
    font-size: 16px;
    font-weight: 500;
    color: #303133;
  }
}

.chart-container {
  height: 400px;
  padding: 20px;
}

.shortcut-row {
  margin-bottom: 24px;
}

.shortcut-card {
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.shortcut-content {
  display: flex;
  align-items: center;
  padding: 20px;

  .el-icon {
    font-size: 24px;
    color: #ff6f00;
    margin-right: 16px;
  }
}

.action-info {
  display: flex;
  flex-direction: column;
}

.action-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.action-desc {
  font-size: 12px;
  color: #909399;
}

:deep(.el-badge__content) {
  z-index: 1;
}
</style>

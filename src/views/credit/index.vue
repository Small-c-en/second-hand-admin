<template>
  <div class="credit-system">
    <el-row :gutter="24">
      <!-- 信用分看板 -->
      <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
        <el-card class="credit-board-card">
          <template #header>
            <div class="card-header">
              <span>信用评分</span>
              <el-button-group>
                <el-button @click="handleExport">
                  <el-icon><Download /></el-icon>导出报告
                </el-button>
              </el-button-group>
            </div>
          </template>

          <div v-if="currentUser" class="credit-score">
            <div class="score-circle">
              <div ref="radarChartRef" class="radar-chart" />
            </div>
            <div class="total-score">
              <span class="score-number">{{ currentUser.totalScore }}</span>
              <span class="score-total">/1000</span>
            </div>

            <div class="user-tags">
              <el-tag
                v-for="tag in currentUser.tags"
                :key="tag.name"
                :type="tag.type"
                :effect="tag.effect"
                class="user-tag"
              >
                {{ tag.name }}
              </el-tag>
            </div>

            <div class="dimension-scores">
              <div
                v-for="(score, dimension) in currentUser.dimensionScores"
                :key="dimension"
                class="dimension-item"
              >
                <span class="dimension-label">{{ dimension }}</span>
                <el-progress
                  :percentage="score"
                  :color="getProgressColor(score)"
                  :format="(val) => val"
                />
              </div>
            </div>
          </div>
          <el-empty v-else description="请选择用户" />
        </el-card>
      </el-col>

      <!-- 用户列表 -->
      <el-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16">
        <el-card class="user-list-card">
          <template #header>
            <div class="card-header">
              <div class="search-bar">
                <el-input
                  v-model="searchQuery"
                  placeholder="搜索用户名/ID"
                  prefix-icon="Search"
                  clearable
                  style="width: 200px"
                />
                <el-select
                  v-model="filters.riskLevel"
                  placeholder="风险等级"
                  clearable
                  style="width: 120px"
                >
                  <el-option label="全部" value="" />
                  <el-option label="高风险" value="high" />
                  <el-option label="中风险" value="medium" />
                  <el-option label="低风险" value="low" />
                </el-select>
                <el-select
                  v-model="filters.tag"
                  placeholder="用户标签"
                  clearable
                  style="width: 120px"
                >
                  <el-option label="全部" value="" />
                  <el-option label="优质用户" value="premium" />
                  <el-option label="新用户" value="new" />
                </el-select>
              </div>
            </div>
          </template>

          <el-table :data="userList" style="width: 100%" @row-click="handleSelectUser">
            <el-table-column prop="id" label="用户ID" width="120" />
            <el-table-column prop="name" label="用户名" width="120" />
            <el-table-column prop="creditScore" label="信用分" width="100">
              <template #default="{ row }">
                <span :class="getCreditScoreClass(row.creditScore)">
                  {{ row.creditScore }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="tags" label="标签">
              <template #default="{ row }">
                <el-tag
                  v-for="tag in row.tags"
                  :key="tag.name"
                  :type="tag.type"
                  size="small"
                  class="mr-1"
                >
                  {{ tag.name }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="riskLevel" label="风险等级" width="100">
              <template #default="{ row }">
                <el-tag :type="getRiskLevelType(row.riskLevel)">
                  {{ getRiskLevelText(row.riskLevel) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column fixed="right" label="操作" width="150">
              <template #default="{ row }">
                <el-button link type="primary" @click.stop="handleViewDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :total="total"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 用户详情抽屉 -->
    <el-drawer v-model="detailDrawerVisible" title="用户详情" size="800px" :destroy-on-close="true">
      <template v-if="currentUser">
        <div class="user-detail">
          <div class="detail-section">
            <h4>交易统计</h4>
            <el-descriptions :column="3" border>
              <el-descriptions-item label="总订单数">
                {{ currentUser.orderStats.total }}
              </el-descriptions-item>
              <el-descriptions-item label="好评率">
                {{ currentUser.orderStats.goodRate }}%
              </el-descriptions-item>
              <el-descriptions-item label="纠纷率">
                {{ currentUser.orderStats.disputeRate }}%
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <div class="detail-section">
            <h4>违规记录</h4>
            <el-timeline>
              <el-timeline-item
                v-for="record in currentUser.violationRecords"
                :key="record.time"
                :type="record.type"
                :timestamp="record.time"
              >
                {{ record.content }}
              </el-timeline-item>
            </el-timeline>
          </div>

          <div class="detail-section">
            <h4>信用分变动</h4>
            <div ref="scoreChartRef" class="score-chart" />
          </div>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'

// 搜索和筛选
const searchQuery = ref('')
const filters = ref({
  riskLevel: '',
  tag: '',
})

// 分页相关
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(100)

// 图表相关
const radarChartRef = ref(null)
const scoreChartRef = ref(null)
let radarChart = null
let scoreChart = null

// 用户列表数据
const userList = ref([
  {
    id: 'U001',
    name: '张三',
    creditScore: 850,
    tags: [
      { name: '优质用户', type: 'success' },
      { name: '低风险', type: 'info' },
    ],
    riskLevel: 'low',
  },
  {
    id: 'U002',
    name: '李四',
    creditScore: 650,
    tags: [{ name: '中等用户', type: 'warning' }],
    riskLevel: 'medium',
  },
])

// 当前选中的用户
const currentUser = ref({
  id: 'U001',
  name: '张三',
  totalScore: 850,
  tags: [
    { name: '优质用户', type: 'success', effect: 'dark' },
    { name: '低风险', type: 'info', effect: 'plain' },
  ],
  dimensionScores: {
    好评率: 95,
    退款率: 85,
    违规记录: 90,
    交易频次: 88,
    账户活跃度: 92,
  },
  orderStats: {
    total: 128,
    goodRate: 98,
    disputeRate: 0.5,
  },
  violationRecords: [
    {
      time: '2024-03-01',
      content: '因虚假交易被举报',
      type: 'danger',
    },
    {
      time: '2024-02-15',
      content: '商品描述不实',
      type: 'warning',
    },
  ],
})

// 详情抽屉
const detailDrawerVisible = ref(false)

// 初始化雷达图
const initRadarChart = () => {
  if (!radarChartRef.value) return

  radarChart = echarts.init(radarChartRef.value)
  const option = {
    color: ['#FF6F00'],
    radar: {
      indicator: [
        { name: '好评率', max: 100 },
        { name: '退款率', max: 100 },
        { name: '违规记录', max: 100 },
        { name: '交易频次', max: 100 },
        { name: '账户活跃度', max: 100 },
      ],
      radius: '65%',
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: [95, 85, 90, 88, 92],
            name: '信用维度',
            areaStyle: {
              color: 'rgba(255, 111, 0, 0.2)',
            },
          },
        ],
      },
    ],
  }
  radarChart.setOption(option)
}

// 初始化分数变化图表
const initScoreChart = () => {
  if (!scoreChartRef.value) return

  scoreChart = echarts.init(scoreChartRef.value)
  const option = {
    color: ['#FF6F00'],
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
    },
    yAxis: {
      type: 'value',
      min: 600,
      max: 1000,
    },
    series: [
      {
        data: [820, 850, 830, 880, 850, 850],
        type: 'line',
        smooth: true,
      },
    ],
  }
  scoreChart.setOption(option)
}

// 生命周期钩子
onMounted(() => {
  initRadarChart()
})

// 工具方法
const getCreditScoreClass = (score) => {
  if (score >= 800) return 'score-high'
  if (score >= 600) return 'score-medium'
  return 'score-low'
}

const getRiskLevelType = (level) => {
  const types = {
    high: 'danger',
    medium: 'warning',
    low: 'success',
  }
  return types[level]
}

const getRiskLevelText = (level) => {
  const texts = {
    high: '高风险',
    medium: '中风险',
    low: '低风险',
  }
  return texts[level]
}

const getProgressColor = (score) => {
  if (score >= 80) return '#67C23A'
  if (score >= 60) return '#E6A23C'
  return '#F56C6C'
}

// 处理函数
const handleSizeChange = (val) => {
  pageSize.value = val
  // 重新加载数据
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  // 重新加载数据
}

const handleExport = () => {
  // 实现导出报告逻辑
}

const handleSelectUser = (row) => {
  currentUser.value = {
    ...row,
    totalScore: row.creditScore,
    dimensionScores: {
      好评率: 95,
      退款率: 85,
      违规记录: 90,
      交易频次: 88,
      账户活跃度: 92,
    },
    orderStats: {
      total: 128,
      goodRate: 98,
      disputeRate: 0.5,
    },
    violationRecords: [
      {
        time: '2024-03-01',
        content: '因虚假交易被举报',
        type: 'danger',
      },
      {
        time: '2024-02-15',
        content: '商品描述不实',
        type: 'warning',
      },
    ],
  }
  initRadarChart()
}

const handleViewDetail = (row) => {
  currentUser.value = row
  detailDrawerVisible.value = true
  nextTick(() => {
    initScoreChart()
  })
}
</script>

<style lang="scss" scoped>
.credit-system {
  padding: 20px;

  .credit-board-card,
  .user-list-card {
    height: calc(100vh - 180px);
    overflow-y: auto;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .search-bar {
      display: flex;
      gap: 12px;
    }
  }

  .credit-score {
    text-align: center;
    padding: 20px 0;

    .score-circle {
      position: relative;
      margin: 0 auto;
      width: 300px;
      height: 300px;

      .radar-chart {
        width: 100%;
        height: 100%;
      }

      .total-score {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);

        .score-number {
          font-size: 36px;
          font-weight: bold;
          color: #ff6f00;
        }

        .score-total {
          font-size: 14px;
          color: #909399;
        }
      }
    }

    .user-tags {
      margin: 20px 0;
      display: flex;
      justify-content: center;
      gap: 8px;
    }

    .dimension-scores {
      text-align: left;
      padding: 0 20px;

      .dimension-item {
        margin-bottom: 16px;

        .dimension-label {
          display: block;
          margin-bottom: 8px;
          color: #606266;
        }
      }
    }
  }

  .score-high {
    color: #67c23a;
    font-weight: 500;
  }

  .score-medium {
    color: #e6a23c;
    font-weight: 500;
  }

  .score-low {
    color: #f56c6c;
    font-weight: 500;
  }

  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: center;
  }

  .user-detail {
    padding: 20px;

    .detail-section {
      margin-bottom: 30px;

      h4 {
        margin-bottom: 16px;
        font-weight: 500;
      }
    }

    .score-chart {
      height: 300px;
    }
  }
}

// 响应式样式
@media screen and (max-width: 768px) {
  .credit-system {
    .el-col {
      margin-bottom: 20px;
    }

    .credit-board-card,
    .user-list-card {
      height: auto;
      min-height: 400px;
    }

    .card-header {
      .search-bar {
        flex-direction: column;
        width: 100%;

        .el-input,
        .el-select {
          width: 100% !important;
        }
      }
    }

    .credit-score {
      .score-circle {
        width: 250px;
        height: 250px;
      }
    }
  }
}
</style>

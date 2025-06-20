<template>
  <div class="message-center">
    <el-row :gutter="24">
      <!-- 模板管理模块 -->
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <el-card class="template-card">
          <template #header>
            <div class="card-header">
              <el-input
                v-model="searchQuery"
                placeholder="搜索模板名称"
                prefix-icon="Search"
                style="max-width: 200px"
              />
              <el-button type="primary" color="#FF6F00" @click="handleCreateTemplate">
                <el-icon><Plus /></el-icon>新建模板
              </el-button>
            </div>
          </template>

          <el-table :data="templateList" style="width: 100%">
            <el-table-column prop="name" label="模板名称" />
            <el-table-column prop="type" label="类型">
              <template #default="{ row }">
                <el-tag :type="row.type === '系统' ? 'info' : 'warning'">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="160" />
            <el-table-column fixed="right" label="操作" width="180">
              <template #default="{ row }">
                <el-button link type="primary" color="#FF6F00" @click="handleEditTemplate(row)"
                  >编辑</el-button
                >
                <el-button link type="primary" @click="handlePreviewTemplate(row)">预览</el-button>
                <el-button link type="danger" @click="handleDeleteTemplate(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 批量发送模块 -->
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <el-card class="batch-send-card" style="background: #f8f9fa">
          <template #header>
            <div class="card-header">
              <span>批量发送消息</span>
            </div>
          </template>

          <el-form :model="batchForm" label-width="100px">
            <el-form-item label="目标群体">
              <el-select v-model="batchForm.targetGroup" style="width: 100%">
                <el-option label="全部用户" value="all" />
                <el-option label="商家" value="merchant" />
                <el-option label="普通用户" value="normal" />
              </el-select>
            </el-form-item>

            <el-form-item label="自定义标签">
              <el-select
                v-model="batchForm.tags"
                multiple
                filterable
                allow-create
                style="width: 100%"
                placeholder="请选择或创建标签"
              >
                <el-option label="信用分≥800" value="credit_800" />
                <el-option label="活跃用户" value="active" />
                <el-option label="新注册用户" value="new" />
              </el-select>
            </el-form-item>

            <el-form-item label="选择模板">
              <el-select v-model="batchForm.templateId" style="width: 100%">
                <el-option
                  v-for="template in recentTemplates"
                  :key="template.id"
                  :label="template.name"
                  :value="template.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="发送时间">
              <el-radio-group v-model="batchForm.sendType">
                <el-radio label="now">立即发送</el-radio>
                <el-radio label="schedule">定时发送</el-radio>
              </el-radio-group>
              <el-date-picker
                v-if="batchForm.sendType === 'schedule'"
                v-model="batchForm.scheduleTime"
                type="datetime"
                placeholder="选择发送时间"
                style="width: 100%; margin-top: 10px"
              />
            </el-form-item>

            <div class="success-rate">
              <div class="rate-title">近7天发送成功率</div>
              <div ref="chartRef" style="width: 100%; height: 200px"></div>
            </div>

            <el-form-item>
              <el-button type="primary" color="#FF6F00" @click="handleSendMessage">
                发送消息
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>

    <!-- 模板编辑抽屉 -->
    <el-drawer v-model="drawerVisible" title="编辑模板" size="600px" :destroy-on-close="true">
      <el-form :model="templateForm" label-width="100px">
        <el-form-item label="模板标题" required>
          <el-input v-model="templateForm.title" placeholder="请输入模板标题" />
        </el-form-item>

        <el-form-item label="模板类型" required>
          <el-select v-model="templateForm.type" style="width: 100%">
            <el-option label="订单" value="order" />
            <el-option label="审核" value="review" />
            <el-option label="公告" value="announcement" />
          </el-select>
        </el-form-item>

        <el-form-item label="模板内容" required>
          <div class="editor-toolbar">
            <el-button-group>
              <el-button @click="insertVariable('用户名')">插入用户名</el-button>
              <el-button @click="insertVariable('订单号')">插入订单号</el-button>
            </el-button-group>
          </div>
          <el-input
            v-model="templateForm.content"
            type="textarea"
            :rows="10"
            placeholder="请输入模板内容"
          />
        </el-form-item>

        <el-form-item label="预览">
          <div class="preview-box">
            {{ previewContent }}
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" color="#FF6F00" @click="handleSaveTemplate">
            保存模板
          </el-button>
          <el-button @click="drawerVisible = false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import * as echarts from 'echarts'

// 模板列表数据
const templateList = ref([
  {
    id: 1,
    name: '订单发货通知',
    type: '交易',
    createTime: '2024-03-15 10:00:00',
  },
  {
    id: 2,
    name: '系统维护公告',
    type: '系统',
    createTime: '2024-03-14 14:30:00',
  },
])

// 搜索查询
const searchQuery = ref('')

// 批量发送表单
const batchForm = ref({
  targetGroup: 'all',
  tags: [],
  templateId: '',
  sendType: 'now',
  scheduleTime: '',
})

// 最近使用的模板
const recentTemplates = ref([
  { id: 1, name: '订单发货通知' },
  { id: 2, name: '系统维护公告' },
  { id: 3, name: '商品审核通过' },
  { id: 4, name: '账户异常提醒' },
  { id: 5, name: '优惠活动通知' },
])

// 模板编辑相关
const drawerVisible = ref(false)
const templateForm = ref({
  title: '',
  type: '',
  content: '',
})

// 预览内容
const previewContent = computed(() => {
  let content = templateForm.value.content
  content = content.replace(/{{用户名}}/g, '张三')
  content = content.replace(/{{订单号}}/g, 'ORDER123456')
  return content
})

// 图表相关
const chartRef = ref(null)
let chart = null

onMounted(() => {
  initChart()
})

const initChart = () => {
  if (!chartRef.value) return

  chart = echarts.init(chartRef.value)
  const option = {
    color: ['#FF6F00'],
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      type: 'category',
      data: ['3-10', '3-11', '3-12', '3-13', '3-14', '3-15', '3-16'],
    },
    yAxis: {
      type: 'value',
      min: 80,
      max: 100,
      axisLabel: {
        formatter: '{value}%',
      },
    },
    series: [
      {
        data: [98, 95, 97, 94, 96, 98, 97],
        type: 'line',
        smooth: true,
      },
    ],
  }
  chart.setOption(option)
}

// 处理函数
const handleCreateTemplate = () => {
  templateForm.value = {
    title: '',
    type: '',
    content: '',
  }
  drawerVisible.value = true
}

const handleEditTemplate = (row) => {
  templateForm.value = {
    title: row.name,
    type: row.type === '系统' ? 'announcement' : 'order',
    content: '尊敬的{{用户名}}，您的订单{{订单号}}已发货',
  }
  drawerVisible.value = true
}

const handlePreviewTemplate = (row) => {
  // 实现预览逻辑
}

const handleDeleteTemplate = (row) => {
  // 实现删除逻辑
}

const insertVariable = (variable) => {
  templateForm.value.content += `{{${variable}}}`
}

const handleSaveTemplate = () => {
  // 实现保存逻辑
  drawerVisible.value = false
}

const handleSendMessage = () => {
  // 实现发送逻辑
}
</script>

<style lang="scss" scoped>
.message-center {
  padding: 20px;

  .template-card,
  .batch-send-card {
    height: calc(100vh - 180px);
    overflow-y: auto;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .editor-toolbar {
    margin-bottom: 10px;
  }

  .preview-box {
    padding: 15px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    background-color: #f8f9fa;
    min-height: 100px;
  }

  .success-rate {
    margin: 20px 0;

    .rate-title {
      margin-bottom: 10px;
      font-weight: 500;
    }
  }

  :deep(.el-drawer__body) {
    padding: 20px;
  }
}

// 响应式样式
@media screen and (max-width: 768px) {
  .message-center {
    .el-col {
      margin-bottom: 20px;
    }
  }
}
</style>

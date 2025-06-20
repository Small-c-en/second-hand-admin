<template>
  <div class="product-review">
    <!-- 批量审核操作栏 -->
    <div class="review-toolbar">
      <div class="left-actions">
        <el-checkbox v-model="selectAll" @change="handleSelectAll">全选</el-checkbox>
        <el-button-group class="ml-4">
          <el-button
            type="primary"
            :class="['batch-btn', { 'pulse-animation': hasSelected }]"
            :disabled="!hasSelected"
            @click="handleBatchApprove"
          >
            <el-icon><Check /></el-icon>
            批量通过
          </el-button>
          <el-button
            type="danger"
            :class="['batch-btn', { 'pulse-animation': hasSelected }]"
            :disabled="!hasSelected"
            @click="handleBatchReject"
          >
            <el-icon><Warning /></el-icon>
            批量拒绝
          </el-button>
        </el-button-group>

        <el-tag v-if="hasSelected" class="selected-count" type="info">
          已选择 {{ selectedCount }} 项
        </el-tag>
      </div>

      <div class="filter-actions">
        <el-input
          v-model="filters.keyword"
          placeholder="搜索商品名称/卖家"
          class="search-input"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select
          v-model="filters.category"
          placeholder="选择分类"
          clearable
          class="filter-select"
        >
          <el-option label="全部分类" value="" />
          <el-option label="电子产品" value="electronics" />
          <el-option label="服装" value="clothing" />
        </el-select>

        <el-select v-model="filters.status" placeholder="审核状态" clearable class="filter-select">
          <el-option label="全部状态" value="" />
          <el-option label="待审核" value="pending">
            <el-icon><Clock /></el-icon>
            <span>待审核</span>
          </el-option>
          <el-option label="高风险" value="high_risk">
            <el-icon><Warning /></el-icon>
            <span>高风险</span>
          </el-option>
        </el-select>

        <el-date-picker
          v-model="filters.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          class="date-picker"
        />
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="3" animated />
    </div>

    <!-- 商品卡片列表 -->
    <el-row v-else :gutter="24" class="product-list">
      <el-col v-for="item in productList" :key="item.id" :xs="24" :sm="12" :md="8" :lg="6" :xl="4">
        <el-card
          :class="[
            'product-card',
            { 'high-risk': item.riskLevel === 'high' },
            { selected: item.selected },
          ]"
          :body-style="{ padding: '0px' }"
          shadow="hover"
        >
          <div class="product-image">
            <el-image
              :src="item.image"
              fit="cover"
              loading="lazy"
              :preview-src-list="[item.image]"
              class="main-image"
            >
              <template #error>
                <div class="image-error">
                  <el-icon><Picture /></el-icon>
                  <span>图片加载失败</span>
                </div>
              </template>
            </el-image>
            <el-tag
              :type="item.riskLevel === 'high' ? 'danger' : 'info'"
              :effect="item.riskLevel === 'high' ? 'dark' : 'light'"
              class="risk-tag"
            >
              <el-icon>
                <Warning v-if="item.riskLevel === 'high'" />
                <InfoFilled v-else />
              </el-icon>
              {{ item.riskLevel === 'high' ? '高风险' : '普通' }}
            </el-tag>
            <el-checkbox
              v-model="item.selected"
              class="select-checkbox"
              @change="handleItemSelect"
            />
          </div>

          <div class="product-content">
            <div class="product-title" :title="item.title">{{ item.title }}</div>
            <div class="product-info">
              <el-tooltip :content="item.seller" placement="top" :show-after="1000">
                <span class="seller">
                  <el-icon><User /></el-icon>
                  {{ item.seller }}
                </span>
              </el-tooltip>
              <el-tooltip :content="item.submitTime" placement="top" :show-after="1000">
                <span class="time">
                  <el-icon><Clock /></el-icon>
                  {{ item.submitTime }}
                </span>
              </el-tooltip>
            </div>

            <div v-if="item.riskLevel === 'high'" class="risk-reason">
              <el-alert type="warning" :title="item.riskReason" :closable="false" show-icon />
            </div>

            <div class="action-buttons">
              <el-button type="primary" class="approve-btn" @click="handleApprove(item)">
                <el-icon><Check /></el-icon>
                通过
              </el-button>
              <el-button type="danger" plain class="reject-btn" @click="handleReject(item)">
                <el-icon><Close /></el-icon>
                拒绝
              </el-button>
              <el-button link type="primary" class="detail-btn" @click="handleViewDetail(item)">
                <el-icon><View /></el-icon>
                详情
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 空状态 -->
    <el-empty
      v-if="!loading && (!productList || productList.length === 0)"
      description="暂无待审核商品"
    >
      <template #image>
        <el-icon :size="60"><Inbox /></el-icon>
      </template>
    </el-empty>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[20, 40, 60, 80]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 拒绝原因弹窗 -->
    <el-dialog
      v-model="rejectDialogVisible"
      title="拒绝原因"
      width="500px"
      destroy-on-close
      class="reject-dialog"
    >
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item label="拒绝原因" required>
          <el-select v-model="rejectForm.reason" style="width: 100%">
            <el-option label="商品信息不完整" value="incomplete">
              <el-icon><InfoFilled /></el-icon>
              <span>商品信息不完整</span>
            </el-option>
            <el-option label="商品图片不清晰" value="unclear_image">
              <el-icon><Picture /></el-icon>
              <span>商品图片不清晰</span>
            </el-option>
            <el-option label="违禁商品" value="forbidden">
              <el-icon><Warning /></el-icon>
              <span>违禁商品</span>
            </el-option>
            <el-option label="价格异常" value="price_abnormal">
              <el-icon><Money /></el-icon>
              <span>价格异常</span>
            </el-option>
            <el-option label="其他原因" value="other">
              <el-icon><More /></el-icon>
              <span>其他原因</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="rejectForm.reason === 'other'" label="补充说明">
          <el-input
            v-model="rejectForm.comment"
            type="textarea"
            :rows="3"
            placeholder="请输入补充说明"
            show-word-limit
            maxlength="200"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmReject" :loading="submitting"> 确认 </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="ProductReviewPage">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Check,
  Close,
  Warning,
  InfoFilled,
  Search,
  Clock,
  User,
  Picture,
  View,
  Money,
  More,
  Inbox,
} from '@element-plus/icons-vue'

// 加载状态
const loading = ref(false)
const submitting = ref(false)

// 筛选条件
const filters = ref({
  category: '',
  status: '',
  dateRange: [],
  keyword: '',
})

// 分页相关
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(100)

// 选择相关
const selectAll = ref(false)
const productList = ref([
  {
    id: 1,
    title: 'iPhone 14 Pro Max 256GB 暗夜紫 99新',
    image: 'https://example.com/iphone.jpg',
    seller: '苹果官方旗舰店',
    submitTime: '2024-03-15 10:30',
    riskLevel: 'normal',
    selected: false,
  },
  {
    id: 2,
    title: '二手 MacBook Pro M2 16寸 32G/1TB',
    image: 'https://example.com/macbook.jpg',
    seller: '数码二手店',
    submitTime: '2024-03-15 09:15',
    riskLevel: 'high',
    riskReason: '商品价格异常，低于市场均价 50%',
    selected: false,
  },
])

// 拒绝相关
const rejectDialogVisible = ref(false)
const rejectForm = ref({
  reason: '',
  comment: '',
})
const currentRejectItem = ref(null)

// 计算属性
const hasSelected = computed(() => {
  return productList.value.some((item) => item.selected)
})

const selectedCount = computed(() => {
  return productList.value.filter((item) => item.selected).length
})

// 处理函数
const handleSelectAll = (val) => {
  productList.value.forEach((item) => {
    item.selected = val
  })
}

const handleItemSelect = () => {
  const selectedItems = productList.value.filter((item) => item.selected)
  selectAll.value = selectedItems.length === productList.value.length
}

const handleSizeChange = (val) => {
  pageSize.value = val
  loadData()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  loadData()
}

const handleApprove = async (item) => {
  try {
    await ElMessageBox.confirm(
      `确认通过商品"${item.title}"的审核？通过后商品将立即上架。`,
      '确认操作',
      {
        confirmButtonText: '确认通过',
        cancelButtonText: '取消',
        type: 'success',
      },
    )
    // TODO: 调用审核通过 API
    await new Promise((resolve) => setTimeout(resolve, 1000))
    ElMessage.success('审核通过成功')
  } catch {
    // 用户取消操作
  }
}

const handleReject = (item) => {
  currentRejectItem.value = item
  rejectDialogVisible.value = true
  rejectForm.value = {
    reason: '',
    comment: '',
  }
}

const handleViewDetail = (item) => {
  // TODO: 实现查看详情逻辑，可以是新页面或弹窗
  console.log('查看详情:', item)
}

const handleBatchApprove = async () => {
  const selectedItems = productList.value.filter((item) => item.selected)
  try {
    await ElMessageBox.confirm(
      `确认批量通过 ${selectedItems.length} 个商品的审核？`,
      '批量操作确认',
      {
        confirmButtonText: '确认通过',
        cancelButtonText: '取消',
        type: 'success',
      },
    )
    // TODO: 调用批量审核通过 API
    ElMessage.success(`已批量通过 ${selectedItems.length} 个商品`)
  } catch {
    // 用户取消操作
  }
}

const handleBatchReject = () => {
  const selectedItems = productList.value.filter((item) => item.selected)
  currentRejectItem.value = selectedItems
  rejectDialogVisible.value = true
  rejectForm.value = {
    reason: '',
    comment: '',
  }
}

const confirmReject = async () => {
  if (!rejectForm.value.reason) {
    ElMessage.warning('请选择拒绝原因')
    return
  }
  if (rejectForm.value.reason === 'other' && !rejectForm.value.comment) {
    ElMessage.warning('请输入补充说明')
    return
  }

  submitting.value = true
  try {
    // TODO: 调用拒绝 API
    await new Promise((resolve) => setTimeout(resolve, 1000))
    ElMessage.success('已拒绝商品')
    rejectDialogVisible.value = false
  } catch {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

const loadData = async () => {
  loading.value = true
  try {
    // TODO: 调用获取商品列表 API
    await new Promise((resolve) => setTimeout(resolve, 1000))
  } catch {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.product-review {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);

  .review-toolbar {
    background: white;
    padding: 16px 24px;
    border-radius: 12px;
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

    @media screen and (max-width: 768px) {
      flex-direction: column;
      gap: 16px;
      align-items: stretch;
    }

    .left-actions {
      display: flex;
      align-items: center;
      gap: 16px;

      .el-checkbox {
        margin-right: 0;
      }
    }

    .filter-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;

      .el-select,
      .el-date-picker {
        width: 180px;

        @media screen and (max-width: 480px) {
          width: 100%;
        }
      }
    }
  }

  .loading-container {
    padding: 40px;
    background: var(--el-bg-color);
    border-radius: 8px;
  }

  .product-list {
    margin-bottom: 24px;
  }

  .product-card {
    margin-bottom: 24px;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s ease;
    border: 2px solid transparent;

    &:hover {
      transform: translateY(-4px);
    }

    &.high-risk {
      border-color: var(--el-color-danger);
    }

    &.selected {
      border-color: var(--el-color-primary);
    }

    .product-image {
      position: relative;
      height: 200px;
      overflow: hidden;

      .main-image {
        width: 100%;
        height: 100%;
        transition: transform 0.3s ease;

        &:hover {
          transform: scale(1.05);
        }
      }

      .image-error {
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: var(--el-fill-color-lighter);
        color: var(--el-text-color-secondary);
        gap: 8px;

        .el-icon {
          font-size: 32px;
        }
      }

      .risk-tag {
        position: absolute;
        top: 12px;
        right: 12px;
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 6px 10px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 1;
      }

      .select-checkbox {
        position: absolute;
        top: 12px;
        left: 12px;
        z-index: 1;
        transform: scale(1.2);
        transition: transform 0.2s ease;

        &:hover {
          transform: scale(1.3);
        }
      }
    }

    .product-content {
      padding: 16px;

      .product-title {
        font-size: 16px;
        font-weight: 500;
        margin-bottom: 12px;
        color: var(--el-text-color-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .product-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;
        color: var(--el-text-color-secondary);
        font-size: 14px;

        .seller,
        .time {
          display: flex;
          align-items: center;
          gap: 4px;

          .el-icon {
            font-size: 16px;
          }
        }
      }

      .risk-reason {
        margin-bottom: 16px;
      }

      .action-buttons {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        margin-top: 16px;

        .el-button {
          padding: 8px 16px;
          display: flex;
          align-items: center;
          gap: 4px;

          .el-icon {
            font-size: 16px;
          }
        }
      }
    }
  }

  .pagination-container {
    display: flex;
    justify-content: center;
    padding: 24px 0;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  }
}

// 弹窗样式优化
:deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;

  .el-dialog__header {
    margin: 0;
    padding: 20px 24px;
    border-bottom: 1px solid #dcdfe6;
  }

  .el-dialog__body {
    padding: 24px;
  }

  .el-dialog__footer {
    padding: 16px 24px;
    border-top: 1px solid #dcdfe6;
  }
}

.reject-dialog {
  .el-select-dropdown__item {
    display: flex;
    align-items: center;
    gap: 8px;

    .el-icon {
      font-size: 16px;
    }
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--el-color-primary-rgb), 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(var(--el-color-primary-rgb), 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(var(--el-color-primary-rgb), 0);
  }
}
</style>

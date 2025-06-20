<template>
  <div class="product-review">
    <el-card class="main-container" shadow="never">
      <!-- 标题和统计信息 -->
      <div class="page-header">
        <div class="header-title">
          <el-icon><Document /></el-icon>
          <h2>商品审核</h2>
          <el-tag type="info" effect="plain" class="stats-tag"> {{ total }} 个待审核商品 </el-tag>
        </div>
        <el-button-group>
          <el-button type="primary" plain @click="refreshData">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
          <el-button type="success">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </el-button-group>
      </div>

      <!-- 筛选和操作工具栏 -->
      <el-card class="toolbar-card" shadow="never">
        <div class="filter-toolbar">
          <el-form :inline="true" :model="filters" class="filter-form">
            <el-form-item label="关键词">
              <el-input
                v-model="filters.keyword"
                placeholder="商品名称/卖家"
                clearable
                prefix-icon="Search"
              />
            </el-form-item>
            <el-form-item label="分类">
              <el-select v-model="filters.category" placeholder="全部分类" clearable>
                <el-option label="电子产品" value="electronics" />
                <el-option label="服装" value="clothing" />
                <el-option label="家居" value="home" />
                <el-option label="图书" value="books" />
              </el-select>
            </el-form-item>
            <el-form-item label="风险等级">
              <el-select v-model="filters.status" placeholder="全部" clearable>
                <el-option label="普通" value="normal">
                  <div class="option-with-icon">
                    <el-icon><InfoFilled /></el-icon>
                    <span>普通</span>
                  </div>
                </el-option>
                <el-option label="高风险" value="high_risk">
                  <div class="option-with-icon">
                    <el-icon><Warning /></el-icon>
                    <span>高风险</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="提交日期">
              <el-date-picker
                v-model="filters.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleFilter">
                <el-icon><Search /></el-icon>
                查询
              </el-button>
              <el-button @click="resetFilters">
                <el-icon><RefreshRight /></el-icon>
                重置
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-card>

      <!-- 批量操作区 -->
      <div class="batch-operations">
        <div class="left-operations">
          <el-checkbox v-model="selectAll" @change="handleSelectAll" class="select-all">
            全选
          </el-checkbox>
          <el-button
            type="primary"
            :class="['batch-btn', { 'has-selected': hasSelected }]"
            :disabled="!hasSelected"
            @click="handleBatchApprove"
          >
            <el-icon><Check /></el-icon>
            批量通过
          </el-button>
          <el-button
            type="danger"
            :class="['batch-btn', { 'has-selected': hasSelected }]"
            :disabled="!hasSelected"
            @click="handleBatchReject"
          >
            <el-icon><Close /></el-icon>
            批量拒绝
          </el-button>
          <el-tag v-if="hasSelected" class="selected-count"> 已选择 {{ selectedCount }} 项 </el-tag>
        </div>
        <div class="right-operations">
          <el-radio-group v-model="displayMode" size="small">
            <el-radio-button label="card">
              <el-icon><Grid /></el-icon>
            </el-radio-button>
            <el-radio-button label="list">
              <el-icon><List /></el-icon>
            </el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="3" animated />
      </div>

      <!-- 卡片视图 -->
      <template v-else-if="displayMode === 'card'">
        <el-row :gutter="20" class="product-list">
          <el-col
            v-for="item in productList"
            :key="item.id"
            :xs="24"
            :sm="12"
            :md="8"
            :lg="6"
            :xl="4"
          >
            <div
              :class="[
                'product-card',
                { 'high-risk': item.riskLevel === 'high' },
                { selected: item.selected },
              ]"
            >
              <div class="product-image-container">
                <el-image
                  :src="item.image"
                  fit="cover"
                  loading="lazy"
                  :preview-src-list="[item.image]"
                >
                  <template #error>
                    <div class="image-placeholder">
                      <el-icon><Picture /></el-icon>
                      <span>暂无图片</span>
                    </div>
                  </template>
                </el-image>

                <div class="card-controls">
                  <el-checkbox
                    v-model="item.selected"
                    @change="handleItemSelect"
                    class="card-checkbox"
                  />
                  <el-tag
                    :type="item.riskLevel === 'high' ? 'danger' : 'info'"
                    :effect="item.riskLevel === 'high' ? 'dark' : 'light'"
                    class="risk-level-tag"
                  >
                    {{ item.riskLevel === 'high' ? '高风险' : '普通' }}
                  </el-tag>
                </div>
              </div>

              <div class="product-info">
                <h3 class="product-title" :title="item.title">{{ item.title }}</h3>
                <div class="price-category">
                  <span class="price">¥{{ item.price || '暂无价格' }}</span>
                  <span class="category">{{ item.category || '未分类' }}</span>
                </div>
                <div class="seller-info">
                  <span class="seller">
                    <el-icon><User /></el-icon>
                    {{ item.seller }}
                  </span>
                  <span class="date">
                    <el-icon><Calendar /></el-icon>
                    {{ item.submitTime }}
                  </span>
                </div>

                <div v-if="item.riskLevel === 'high'" class="risk-warning">
                  <el-alert type="warning" :title="item.riskReason" :closable="false" />
                </div>
              </div>

              <div class="card-actions">
                <el-button type="success" class="approve-btn" @click="handleApprove(item)">
                  通过
                </el-button>
                <el-button type="danger" plain class="reject-btn" @click="handleReject(item)">
                  拒绝
                </el-button>
                <el-button link type="primary" @click="handleViewDetail(item)">
                  <el-icon><View /></el-icon>
                  详情
                </el-button>
              </div>
            </div>
          </el-col>
        </el-row>
      </template>

      <!-- 列表视图 -->
      <template v-else>
        <el-table
          :data="productList"
          style="width: 100%"
          @selection-change="handleSelectionChange"
          v-loading="loading"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column label="商品图片" width="120">
            <template #default="{ row }">
              <el-image
                :src="row.image"
                style="width: 80px; height: 80px"
                fit="cover"
                :preview-src-list="[row.image]"
              ></el-image>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="商品名称" show-overflow-tooltip />
          <el-table-column prop="seller" label="卖家" width="120" />
          <el-table-column prop="submitTime" label="提交时间" width="180" />
          <el-table-column prop="riskLevel" label="风险等级" width="120">
            <template #default="{ row }">
              <el-tag :type="row.riskLevel === 'high' ? 'danger' : 'info'">
                {{ row.riskLevel === 'high' ? '高风险' : '普通' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="handleApprove(row)"> 通过 </el-button>
              <el-button type="danger" size="small" plain @click="handleReject(row)">
                拒绝
              </el-button>
              <el-button link type="primary" @click="handleViewDetail(row)"> 详情 </el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>

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
          :page-sizes="[12, 24, 36, 48]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 拒绝原因弹窗 -->
    <el-dialog v-model="rejectDialogVisible" title="拒绝原因" width="500px" destroy-on-close>
      <el-form :model="rejectForm" label-width="100px">
        <el-form-item label="拒绝原因" required>
          <el-select v-model="rejectForm.reason" style="width: 100%">
            <el-option label="商品信息不完整" value="incomplete" />
            <el-option label="商品图片不清晰" value="unclear_image" />
            <el-option label="违禁商品" value="forbidden" />
            <el-option label="价格异常" value="price_abnormal" />
            <el-option label="其他原因" value="other" />
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
        <el-button type="primary" @click="confirmReject" :loading="submitting">确认</el-button>
      </template>
    </el-dialog>

    <!-- 商品详情弹窗 -->
    <product-detail-dialog
      v-model:visible="detailDialogVisible"
      :product-id="currentDetailProductId"
      :review-data="currentDetailProduct"
      @approve="handleApprove"
      @reject="handleReject"
    />
  </div>
</template>

<script setup name="ProductReviewPage">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Document,
  Search,
  Refresh,
  RefreshRight,
  Download,
  InfoFilled,
  Warning,
  Check,
  Close,
  Picture,
  User,
  View,
  Calendar,
  Grid,
  List,
} from '@element-plus/icons-vue'
import ProductDetailDialog from './components/ProductDetailDialog.vue'

// 加载状态
const loading = ref(false)
const submitting = ref(false)

// 显示模式 - 卡片/列表
const displayMode = ref('card')

// 分页
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)

// 筛选条件
const filters = ref({
  keyword: '',
  category: '',
  status: '',
  dateRange: [],
})

// 重置筛选条件
const resetFilters = () => {
  filters.value = {
    keyword: '',
    category: '',
    status: '',
    dateRange: [],
  }
  fetchData()
}

// 批量操作
const selectAll = ref(false)
const selectedItems = ref([])
const selectedCount = computed(() => productList.value.filter((item) => item.selected).length)
const hasSelected = computed(() => selectedCount.value > 0)

// 拒绝原因弹窗
const rejectDialogVisible = ref(false)
const currentRejectItem = ref(null)
const rejectForm = ref({
  reason: '',
  comment: '',
})

// 商品详情弹窗
const detailDialogVisible = ref(false)
const currentDetailProductId = ref('')
const currentDetailProduct = ref({})

// 模拟数据 - 实际项目中应该从API获取
const productList = ref([
  {
    id: 1,
    title: '二手 iPhone 13 Pro Max 256GB 银色 成色95新',
    image: 'https://picsum.photos/400/300?random=1',
    seller: '用户123456',
    submitTime: '2023-05-15 14:30',
    riskLevel: 'normal',
    price: 6299,
    category: '电子产品',
    selected: false,
  },
  {
    id: 2,
    title: '耐克运动鞋 Air Max 270 黑色 43码 几乎全新',
    image: 'https://picsum.photos/400/300?random=2',
    seller: 'nike_fans',
    submitTime: '2023-05-15 12:15',
    riskLevel: 'normal',
    price: 499,
    category: '服装',
    selected: false,
  },
  {
    id: 3,
    title: '二手 MacBook Pro 2022 M2芯片 16GB内存 银色',
    image: 'https://picsum.photos/400/300?random=3',
    seller: 'apple_lover',
    submitTime: '2023-05-15 09:45',
    riskLevel: 'high',
    riskReason: '价格明显低于市场价，可能存在欺诈',
    price: 7999,
    category: '电子产品',
    selected: false,
  },
  {
    id: 4,
    title: '宜家书桌 白色 120x60cm 九成新',
    image: 'https://picsum.photos/400/300?random=4',
    seller: 'home_design',
    submitTime: '2023-05-14 18:20',
    riskLevel: 'normal',
    price: 299,
    category: '家居',
    selected: false,
  },
  {
    id: 5,
    title: '《哈利波特》英文原版全集 精装 品相完好',
    image: 'https://picsum.photos/400/300?random=5',
    seller: 'book_worm',
    submitTime: '2023-05-14 16:10',
    riskLevel: 'normal',
    price: 599,
    category: '图书',
    selected: false,
  },
  {
    id: 6,
    title: '索尼 WH-1000XM4 无线降噪耳机 黑色 包装完好',
    image: 'https://picsum.photos/400/300?random=6',
    seller: 'music_fan',
    submitTime: '2023-05-14 11:30',
    riskLevel: 'high',
    riskReason: '商品信息与图片不符',
    price: 1299,
    category: '电子产品',
    selected: false,
  },
])

// 监听全选框
watch(selectAll, (newValue) => {
  productList.value.forEach((item) => {
    item.selected = newValue
  })
})

// 处理单项选择变化
const handleItemSelect = () => {
  const allSelected = productList.value.every((item) => item.selected)
  const someSelected = productList.value.some((item) => item.selected)

  selectAll.value = allSelected

  if (someSelected && !allSelected) {
    selectAll.value = false
  }
}

// 表格选择变化
const handleSelectionChange = (selection) => {
  selectedItems.value = selection
  const allSelected = selection.length === productList.value.length
  selectAll.value = allSelected && productList.value.length > 0
}

// 全选操作
const handleSelectAll = (val) => {
  productList.value.forEach((item) => {
    item.selected = val
  })
}

// 批量通过
const handleBatchApprove = () => {
  const selectedIds = productList.value.filter((item) => item.selected).map((item) => item.id)

  if (selectedIds.length === 0) return

  ElMessageBox.confirm(`确定通过选中的 ${selectedIds.length} 个商品吗？`, '操作确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info',
  })
    .then(() => {
      loading.value = true
      setTimeout(() => {
        ElMessage.success(`已批量通过 ${selectedIds.length} 个商品`)
        productList.value = productList.value.filter((item) => !item.selected)
        selectAll.value = false
        loading.value = false
      }, 1000)
    })
    .catch(() => {})
}

// 批量拒绝
const handleBatchReject = () => {
  const selectedIds = productList.value.filter((item) => item.selected).map((item) => item.id)

  if (selectedIds.length === 0) return

  rejectDialogVisible.value = true
  currentRejectItem.value = null // 表示批量操作
}

// 单个通过
const handleApprove = (item) => {
  ElMessageBox.confirm('确定通过该商品吗？', '操作确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info',
  })
    .then(() => {
      loading.value = true
      setTimeout(() => {
        ElMessage.success('商品已通过审核')
        productList.value = productList.value.filter((i) => i.id !== item.id)
        loading.value = false
      }, 800)
    })
    .catch(() => {})
}

// 单个拒绝
const handleReject = (item) => {
  rejectDialogVisible.value = true
  currentRejectItem.value = item
  rejectForm.value = {
    reason: '',
    comment: '',
  }
}

// 确认拒绝
const confirmReject = () => {
  if (!rejectForm.value.reason) {
    ElMessage.warning('请选择拒绝原因')
    return
  }

  submitting.value = true

  setTimeout(() => {
    if (currentRejectItem.value) {
      // 单个拒绝
      ElMessage.success('已拒绝该商品')
      productList.value = productList.value.filter((item) => item.id !== currentRejectItem.value.id)
    } else {
      // 批量拒绝
      const selectedIds = productList.value.filter((item) => item.selected).map((item) => item.id)

      ElMessage.success(`已批量拒绝 ${selectedIds.length} 个商品`)
      productList.value = productList.value.filter((item) => !item.selected)
      selectAll.value = false
    }

    rejectDialogVisible.value = false
    submitting.value = false
  }, 1000)
}

// 查看详情
const handleViewDetail = (item) => {
  currentDetailProductId.value = item.id
  currentDetailProduct.value = item
  detailDialogVisible.value = true
}

// 处理筛选
const handleFilter = () => {
  fetchData()
}

// 分页相关
const handleSizeChange = (size) => {
  pageSize.value = size
  fetchData()
}

const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchData()
}

// 刷新数据
const refreshData = () => {
  fetchData()
  ElMessage.success('数据已刷新')
}

// 获取数据
const fetchData = () => {
  loading.value = true
  // 模拟API请求
  setTimeout(() => {
    total.value = 256 // 模拟总数据量
    loading.value = false
  }, 800)
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.product-review {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 120px);

  .main-container {
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    background-color: #fff;
    padding: 20px;

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #ebeef5;

      .header-title {
        display: flex;
        align-items: center;
        gap: 12px;

        h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #303133;
        }

        .el-icon {
          color: #409eff;
          font-size: 22px;
        }

        .stats-tag {
          font-size: 14px;
          padding: 6px 10px;
          border-radius: 16px;
        }
      }

      .el-button-group {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }

    .toolbar-card {
      margin-bottom: 20px;
      background-color: #f9fafc;
      border-radius: 8px;
      padding: 16px;

      .filter-toolbar {
        .filter-form {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;

          .el-form-item {
            margin-bottom: 0;
            margin-right: 0;

            &:last-child {
              margin-left: auto;
            }
          }

          .el-input,
          .el-select,
          .el-date-picker {
            width: 220px;
          }

          @media (max-width: 768px) {
            .el-input,
            .el-select,
            .el-date-picker {
              width: 100%;
            }

            .el-form-item:last-child {
              margin-left: 0;
              width: 100%;
              display: flex;
              justify-content: flex-end;
            }
          }
        }
      }
    }

    .batch-operations {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding: 16px;
      background-color: #f9fafc;
      border-radius: 8px;

      .left-operations {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;

        .select-all {
          margin-right: 8px;
        }

        .batch-btn {
          transition: all 0.3s ease;

          &.el-button--primary {
            background-color: white;
            color: #606266;
            border-color: #dcdfe6;

            &:hover {
              background-color: #f0f9eb;
              color: #67c23a;
              border-color: #67c23a;
            }

            &.has-selected {
              position: relative;
              overflow: hidden;
            }
          }

          &.el-button--danger {
            background-color: white;
            color: #606266;
            border-color: #dcdfe6;

            &:hover {
              background-color: #fef0f0;
              color: #f56c6c;
              border-color: #f56c6c;
            }
          }
        }

        .selected-count {
          background-color: #f4f4f5;
          color: #606266;
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 14px;
        }
      }

      .right-operations {
        .el-radio-group {
          .el-radio-button {
            .el-radio-button__inner {
              padding: 8px 15px;
            }
          }
        }
      }
    }

    .product-list {
      margin: 0 -10px 24px;

      .el-col {
        padding: 0 10px;
      }

      .product-card {
        background-color: white;
        border-radius: 8px;
        overflow: hidden;
        position: relative;
        transition: all 0.3s ease;
        margin-bottom: 24px;
        border: 1px solid #ebeef5;
        display: flex;
        flex-direction: column;
        height: 100%;

        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
        }

        &.selected {
          border: 2px solid #409eff;

          .card-checkbox {
            transform: scale(1.1);
          }
        }

        &.high-risk {
          border: 2px solid #f56c6c;
        }

        .product-image-container {
          height: 200px;
          overflow: hidden;
          background-color: #f5f7fa;
          position: relative;

          .el-image {
            width: 100%;
            height: 100%;

            :deep(img) {
              width: 100%;
              height: 100%;
              object-fit: cover;
              transition: transform 0.3s ease;
            }

            &:hover {
              :deep(img) {
                transform: scale(1.05);
              }
            }
          }

          .image-placeholder {
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: #909399;

            .el-icon {
              font-size: 40px;
              margin-bottom: 8px;
            }
          }

          .card-controls {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            padding: 8px;
            display: flex;
            justify-content: space-between;
            z-index: 2;

            .card-checkbox {
              background-color: rgba(255, 255, 255, 0.8);
              border-radius: 4px;
              padding: 4px;
              transition: all 0.2s ease;
            }

            .risk-level-tag {
              padding: 4px 8px;
              font-size: 12px;
            }
          }
        }

        .product-info {
          padding: 16px;
          flex: 1;
          display: flex;
          flex-direction: column;

          .product-title {
            font-size: 16px;
            font-weight: 500;
            margin-top: 0;
            margin-bottom: 12px;
            line-height: 1.4;
            color: #303133;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }

          .price-category {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;

            .price {
              color: #f56c6c;
              font-size: 16px;
              font-weight: 600;
            }

            .category {
              color: #909399;
              font-size: 13px;
              background-color: #f4f4f5;
              padding: 2px 8px;
              border-radius: 12px;
            }
          }

          .seller-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            color: #909399;
            font-size: 13px;

            .seller,
            .date {
              display: flex;
              align-items: center;
              gap: 4px;

              .el-icon {
                font-size: 14px;
              }
            }
          }

          .risk-warning {
            margin: 12px 0;
          }
        }

        .card-actions {
          padding: 12px 16px;
          display: flex;
          border-top: 1px solid #ebeef5;

          .el-button {
            flex: 1;

            &:last-child {
              flex: none;
              margin-left: auto;
            }
          }

          .approve-btn,
          .reject-btn {
            height: 38px;
            font-size: 15px;
            font-weight: 500;
          }

          .approve-btn {
            background-color: #f0f9eb;
            color: #67c23a;
            border-color: #c2e7b0;

            &:hover {
              background-color: #67c23a;
              color: #ffffff;
              border-color: #67c23a;
            }
          }
        }
      }
    }

    .pagination-container {
      display: flex;
      justify-content: center;
      padding: 24px 0 8px;
    }
  }
}

// 选项样式
.option-with-icon {
  display: flex;
  align-items: center;
  gap: 8px;

  .el-icon {
    font-size: 16px;
  }
}

// 加载状态样式
.loading-container {
  padding: 40px 0;
}

// 对话框样式
:deep(.el-dialog) {
  border-radius: 8px;
  overflow: hidden;

  .el-dialog__header {
    padding: 16px 20px;
    margin: 0;
    border-bottom: 1px solid #ebeef5;
  }

  .el-dialog__body {
    padding: 20px;
  }

  .el-dialog__footer {
    padding: 12px 20px;
    border-top: 1px solid #ebeef5;
  }
}
</style>

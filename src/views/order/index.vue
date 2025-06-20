<!-- 订单管理页面 -->
<template>
  <div class="order-container">
    <!-- 筛选栏 -->
    <el-card class="filter-container" shadow="never">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="订单状态">
          <el-select v-model="filterForm.status" placeholder="请选择状态" clearable>
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="下单时间">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :shortcuts="dateShortcuts"
          />
        </el-form-item>
        <el-form-item label="订单金额">
          <el-input-number
            v-model="filterForm.minAmount"
            :min="0"
            placeholder="最小值"
            style="width: 130px"
          />
          <span class="separator">-</span>
          <el-input-number
            v-model="filterForm.maxAmount"
            :min="0"
            placeholder="最大值"
            style="width: 130px"
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="filterForm.keyword"
            placeholder="搜索订单号/买家昵称/手机号"
            prefix-icon="Search"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 订单列表 -->
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>订单列表</span>
          <el-button type="success" plain @click="handleExport">
            <el-icon><Download /></el-icon>导出数据
          </el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="orderList" style="width: 100%">
        <el-table-column prop="orderId" label="订单号" width="180" />
        <el-table-column label="商品信息" min-width="300">
          <template #default="{ row }">
            <div v-for="item in row.products" :key="item.id" class="product-item">
              <el-image
                :src="item.image"
                :preview-src-list="[item.image]"
                class="product-image"
                fit="cover"
              />
              <div class="product-info">
                <div class="product-title">{{ item.title }}</div>
                <div class="product-price">¥{{ item.price }} x {{ item.quantity }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="买家信息" width="180">
          <template #default="{ row }">
            <div class="buyer-info">
              <div class="buyer-name">{{ row.buyer.name }}</div>
              <div class="buyer-phone">{{ row.buyer.phone }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="订单金额" width="120">
          <template #default="{ row }">
            <div class="amount-info">
              <div class="total-amount">¥{{ row.totalAmount }}</div>
              <div v-if="row.originalAmount" class="original-amount">¥{{ row.originalAmount }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="下单时间" width="180" />
        <el-table-column prop="status" label="订单状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'pending'" type="primary" link @click="handleShip(row)">
              发货
            </el-button>
            <el-button
              v-if="row.status === 'refunding'"
              type="warning"
              link
              @click="handleRefund(row)"
            >
              退款处理
            </el-button>
            <el-button type="primary" link @click="handleDetail(row)"> 详情 </el-button>
            <el-button
              v-if="row.status === 'completed'"
              type="danger"
              link
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 发货弹窗 -->
    <el-dialog
      v-model="shipDialogVisible"
      title="订单发货"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form ref="shipFormRef" :model="shipForm" :rules="shipRules" label-width="100px">
        <el-form-item label="物流公司" prop="company">
          <el-select v-model="shipForm.company" placeholder="请选择物流公司">
            <el-option
              v-for="item in logisticsCompanies"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="物流单号" prop="trackingNo">
          <el-input v-model="shipForm.trackingNo" placeholder="请输入物流单号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="shipDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitShip">确认发货</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 退款处理弹窗 -->
    <el-dialog
      v-model="refundDialogVisible"
      title="退款处理"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form ref="refundFormRef" :model="refundForm" :rules="refundRules" label-width="100px">
        <el-form-item label="退款金额" prop="amount">
          <el-input-number
            v-model="refundForm.amount"
            :min="0"
            :precision="2"
            :step="0.01"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="退款原因" prop="reason">
          <el-input
            v-model="refundForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入退款原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="refundDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitRefund">确认退款</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Download, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 筛选表单
const filterForm = reactive({
  status: '',
  dateRange: [],
  minAmount: null,
  maxAmount: null,
  keyword: '',
})

// 状态选项
const statusOptions = [
  { value: 'pending', label: '待发货' },
  { value: 'shipped', label: '已发货' },
  { value: 'completed', label: '已完成' },
  { value: 'refunding', label: '退款中' },
  { value: 'refunded', label: '已退款' },
  { value: 'cancelled', label: '已取消' },
]

// 日期快捷选项
const dateShortcuts = [
  {
    text: '最近一周',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    },
  },
  {
    text: '最近一个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      return [start, end]
    },
  },
  {
    text: '最近三个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
      return [start, end]
    },
  },
]

// 物流公司选项
const logisticsCompanies = [
  { value: 'SF', label: '顺丰速运' },
  { value: 'YTO', label: '圆通速递' },
  { value: 'ZTO', label: '中通快递' },
  { value: 'YD', label: '韵达快递' },
  { value: 'EMS', label: 'EMS' },
]

// 表格数据
const loading = ref(false)
const orderList = ref([
  {
    orderId: 'SN2025060500123',
    products: [
      {
        id: '1001',
        title: 'iPhone 12 Pro Max 256G',
        image: 'https://placeholder.com/300x300',
        price: 6999,
        quantity: 1,
      },
    ],
    buyer: {
      name: '张三',
      phone: '138****1234',
    },
    totalAmount: 6999,
    originalAmount: 7999,
    createTime: '2025-06-05 14:30:00',
    status: 'pending',
  },
])

// 分页
const page = ref(1)
const pageSize = ref(10)
const total = ref(100)

// 发货弹窗
const shipDialogVisible = ref(false)
const shipForm = reactive({
  company: '',
  trackingNo: '',
})
const shipRules = {
  company: [{ required: true, message: '请选择物流公司', trigger: 'change' }],
  trackingNo: [{ required: true, message: '请输入物流单号', trigger: 'blur' }],
}

// 退款弹窗
const refundDialogVisible = ref(false)
const refundForm = reactive({
  amount: 0,
  reason: '',
})
const refundRules = {
  amount: [{ required: true, message: '请输入退款金额', trigger: 'blur' }],
  reason: [{ required: true, message: '请输入退款原因', trigger: 'blur' }],
}

// 获取状态类型
const getStatusType = (status) => {
  const map = {
    pending: 'warning',
    shipped: 'primary',
    completed: 'success',
    refunding: 'danger',
    refunded: 'info',
    cancelled: 'info',
  }
  return map[status]
}

// 获取状态标签
const getStatusLabel = (status) => {
  const map = {
    pending: '待发货',
    shipped: '已发货',
    completed: '已完成',
    refunding: '退款中',
    refunded: '已退款',
    cancelled: '已取消',
  }
  return map[status]
}

// 处理查询
const handleSearch = () => {
  // TODO: 实现查询逻辑
  console.log('查询条件：', filterForm)
}

// 处理重置
const handleReset = () => {
  Object.assign(filterForm, {
    status: '',
    dateRange: [],
    minAmount: null,
    maxAmount: null,
    keyword: '',
  })
  handleSearch()
}

// 处理导出
const handleExport = () => {
  // TODO: 实现导出逻辑
  ElMessage.success('导出成功')
}

// 处理分页大小变化
const handleSizeChange = (val) => {
  pageSize.value = val
  handleSearch()
}

// 处理页码变化
const handleCurrentChange = (val) => {
  page.value = val
  handleSearch()
}

// 处理发货
const handleShip = (row) => {
  shipDialogVisible.value = true
  // TODO: 设置当前订单信息
}

// 提交发货
const submitShip = () => {
  // TODO: 实现发货提交逻辑
  ElMessage.success('发货成功')
  shipDialogVisible.value = false
}

// 处理退款
const handleRefund = (row) => {
  refundDialogVisible.value = true
  refundForm.amount = row.totalAmount
  // TODO: 设置当前订单信息
}

// 提交退款
const submitRefund = () => {
  // TODO: 实现退款提交逻辑
  ElMessage.success('退款成功')
  refundDialogVisible.value = false
}

// 处理详情
const handleDetail = (row) => {
  // TODO: 实现查看详情逻辑
  console.log('查看订单详情：', row)
}

// 处理删除
const handleDelete = (row) => {
  ElMessageBox.confirm('确认删除该订单？此操作不可恢复', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    // TODO: 实现删除逻辑
    ElMessage.success('删除成功')
  })
}
</script>

<style scoped>
.order-container {
  padding: 20px;
}

.filter-container {
  margin-bottom: 20px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.separator {
  margin: 0 10px;
  color: #909399;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #ebeef5;
}

.product-item:last-child {
  border-bottom: none;
}

.product-image {
  width: 50px;
  height: 50px;
  margin-right: 10px;
  border-radius: 4px;
}

.product-info {
  flex: 1;
}

.product-title {
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
}

.product-price {
  font-size: 12px;
  color: #909399;
}

.buyer-info {
  display: flex;
  flex-direction: column;
}

.buyer-name {
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
}

.buyer-phone {
  font-size: 12px;
  color: #909399;
}

.amount-info {
  display: flex;
  flex-direction: column;
}

.total-amount {
  font-size: 14px;
  color: #f56c6c;
  font-weight: bold;
}

.original-amount {
  font-size: 12px;
  color: #909399;
  text-decoration: line-through;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>

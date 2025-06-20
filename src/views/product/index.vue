<!-- 商品管理页面 -->
<template>
  <div class="product-container">
    <!-- 筛选栏 -->
    <el-card class="filter-container" shadow="never">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="商品分类">
          <el-cascader
            v-model="filterForm.category"
            :options="categoryOptions"
            :props="{ checkStrictly: true }"
            clearable
            placeholder="请选择分类"
          />
        </el-form-item>
        <el-form-item label="商品状态">
          <el-select v-model="filterForm.status" placeholder="请选择状态" clearable>
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="价格区间">
          <el-input-number
            v-model="filterForm.minPrice"
            :min="0"
            placeholder="最小值"
            style="width: 130px"
          />
          <span class="separator">-</span>
          <el-input-number
            v-model="filterForm.maxPrice"
            :min="0"
            placeholder="最大值"
            style="width: 130px"
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="filterForm.keyword"
            placeholder="搜索商品标题/ID/卖家昵称"
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

    <!-- 操作栏 -->
    <div class="operation-container">
      <div class="left">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>新增商品
        </el-button>
        <el-button type="danger" :disabled="!selectedProducts.length" @click="handleBatchDelete">
          <el-icon><Delete /></el-icon>批量删除
        </el-button>
      </div>
      <div class="right">
        <el-button type="success" plain @click="handleExport">
          <el-icon><Download /></el-icon>导出数据
        </el-button>
      </div>
    </div>

    <!-- 商品列表 -->
    <el-card shadow="never">
      <el-table
        v-loading="loading"
        :data="productList"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="商品信息" min-width="400">
          <template #default="{ row }">
            <div class="product-info">
              <el-image
                :src="row.image"
                :preview-src-list="[row.image]"
                class="product-image"
                fit="cover"
              />
              <div class="product-detail">
                <div class="product-title">{{ row.title }}</div>
                <div class="product-id">ID: {{ row.id }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column label="价格" width="150">
          <template #default="{ row }">
            <div class="price-info">
              <span class="current-price">¥{{ row.price }}</span>
              <span v-if="row.originalPrice" class="original-price">¥{{ row.originalPrice }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'pending'"
              type="primary"
              link
              @click="handleAudit(row)"
            >
              审核
            </el-button>
            <el-button
              v-if="row.status === 'online'"
              type="warning"
              link
              @click="handleOffline(row)"
            >
              下架
            </el-button>
            <el-button
              v-if="row.status === 'offline'"
              type="success"
              link
              @click="handleOnline(row)"
            >
              上架
            </el-button>
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
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

    <!-- 审核弹窗 -->
    <el-dialog
      v-model="auditDialogVisible"
      title="商品审核"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form ref="auditFormRef" :model="auditForm" :rules="auditRules" label-width="80px">
        <el-form-item label="审核结果" prop="result">
          <el-radio-group v-model="auditForm.result">
            <el-radio label="pass">通过</el-radio>
            <el-radio label="reject">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="auditForm.result === 'reject'" label="驳回原因" prop="reason">
          <el-input
            v-model="auditForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入驳回原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="auditDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAudit">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Plus, Delete, Download, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 筛选表单
const filterForm = reactive({
  category: [],
  status: '',
  minPrice: null,
  maxPrice: null,
  keyword: '',
})

// 分类选项
const categoryOptions = [
  {
    value: 'electronics',
    label: '电子产品',
    children: [
      { value: 'phone', label: '手机' },
      { value: 'computer', label: '电脑' },
    ],
  },
  {
    value: 'clothing',
    label: '服饰',
    children: [
      { value: 'men', label: '男装' },
      { value: 'women', label: '女装' },
    ],
  },
]

// 状态选项
const statusOptions = [
  { value: 'pending', label: '待审核' },
  { value: 'online', label: '在售' },
  { value: 'offline', label: '已下架' },
]

// 表格数据
const loading = ref(false)
const productList = ref([
  {
    id: '1001',
    title: 'iPhone 12 Pro Max 256G',
    image: 'https://placeholder.com/300x300',
    category: '电子产品/手机',
    price: 6999,
    originalPrice: 7999,
    status: 'online',
  },
])
const selectedProducts = ref([])

// 分页
const page = ref(1)
const pageSize = ref(10)
const total = ref(100)

// 审核弹窗
const auditDialogVisible = ref(false)
const auditForm = reactive({
  result: 'pass',
  reason: '',
})
const auditRules = {
  result: [{ required: true, message: '请选择审核结果', trigger: 'change' }],
  reason: [
    {
      required: true,
      message: '请输入驳回原因',
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (auditForm.result === 'reject' && !value) {
          callback(new Error('请输入驳回原因'))
        } else {
          callback()
        }
      },
    },
  ],
}

// 获取状态类型
const getStatusType = (status) => {
  const map = {
    pending: 'warning',
    online: 'success',
    offline: 'info',
  }
  return map[status]
}

// 获取状态标签
const getStatusLabel = (status) => {
  const map = {
    pending: '待审核',
    online: '在售',
    offline: '已下架',
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
    category: [],
    status: '',
    minPrice: null,
    maxPrice: null,
    keyword: '',
  })
  handleSearch()
}

// 处理新增
const handleAdd = () => {
  // TODO: 实现新增逻辑
}

// 处理编辑
const handleEdit = (row) => {
  // TODO: 实现编辑逻辑
  console.log('编辑商品：', row)
}

// 处理删除
const handleDelete = (row) => {
  ElMessageBox.confirm('确认删除该商品？此操作不可恢复', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    // TODO: 实现删除逻辑
    ElMessage.success('删除成功')
  })
}

// 处理批量删除
const handleBatchDelete = () => {
  if (!selectedProducts.value.length) return
  ElMessageBox.confirm(
    `确认删除选中的 ${selectedProducts.value.length} 件商品？此操作不可恢复`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    },
  ).then(() => {
    // TODO: 实现批量删除逻辑
    ElMessage.success('批量删除成功')
  })
}

// 处理导出
const handleExport = () => {
  // TODO: 实现导出逻辑
  ElMessage.success('导出成功')
}

// 处理选择变化
const handleSelectionChange = (selection) => {
  selectedProducts.value = selection
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

// 处理审核
const handleAudit = (row) => {
  auditDialogVisible.value = true
  // TODO: 设置当前审核的商品信息
}

// 处理上架
const handleOnline = (row) => {
  ElMessageBox.confirm('确认上架该商品？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    // TODO: 实现上架逻辑
    ElMessage.success('上架成功')
  })
}

// 处理下架
const handleOffline = (row) => {
  ElMessageBox.confirm('确认下架该商品？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    // TODO: 实现下架逻辑
    ElMessage.success('下架成功')
  })
}

// 提交审核
const submitAudit = () => {
  // TODO: 实现审核提交逻辑
  ElMessage.success(auditForm.result === 'pass' ? '审核通过' : `审核驳回：${auditForm.reason}`)
  auditDialogVisible.value = false
}
</script>

<style scoped>
.product-container {
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

.operation-container {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
}

.product-info {
  display: flex;
  align-items: center;
}

.product-image {
  width: 60px;
  height: 60px;
  margin-right: 10px;
  border-radius: 4px;
}

.product-detail {
  display: flex;
  flex-direction: column;
}

.product-title {
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
}

.product-id {
  font-size: 12px;
  color: #909399;
}

.price-info {
  display: flex;
  flex-direction: column;
}

.current-price {
  font-size: 14px;
  color: #f56c6c;
  font-weight: bold;
}

.original-price {
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

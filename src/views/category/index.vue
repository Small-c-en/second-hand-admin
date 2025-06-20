<template>
  <div class="category-management">
    <el-row :gutter="24">
      <!-- 分类树状图 -->
      <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
        <el-card class="category-tree-card">
          <template #header>
            <div class="card-header">
              <span>分类管理</span>
              <div class="header-actions">
                <el-button-group>
                  <el-button type="primary" color="#FF6F00" @click="handleAddCategory">
                    <el-icon><Plus /></el-icon>添加一级分类
                  </el-button>
                  <el-button @click="handleImportCategories">
                    <el-icon><Upload /></el-icon>导入
                  </el-button>
                  <el-button @click="handleExportCategories">
                    <el-icon><Download /></el-icon>导出
                  </el-button>
                </el-button-group>
              </div>
            </div>
          </template>

          <el-tree
            ref="categoryTree"
            :data="categoryData"
            :props="defaultProps"
            node-key="id"
            draggable
            :allow-drop="allowDrop"
            @node-drag-end="handleDragEnd"
            @node-contextmenu="handleContextMenu"
          >
            <template #default="{ node, data }">
              <div class="custom-tree-node">
                <span class="node-icon">
                  <el-icon v-if="!node.isLeaf"><Folder /></el-icon>
                  <el-icon v-else><Document /></el-icon>
                </span>
                <span class="node-label">{{ node.label }}</span>
                <el-tag size="small" :type="data.status === 'enabled' ? 'success' : 'danger'">
                  {{ data.status === 'enabled' ? '启用' : '禁用' }}
                </el-tag>
              </div>
            </template>
          </el-tree>
        </el-card>
      </el-col>

      <!-- 属性定义 -->
      <el-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16">
        <el-card class="attribute-card">
          <template #header>
            <div class="card-header">
              <span>属性定义</span>
              <el-button type="primary" color="#FF6F00" @click="handleAddAttribute">
                <el-icon><Plus /></el-icon>新建属性
              </el-button>
            </div>
          </template>

          <el-table :data="attributeList" style="width: 100%">
            <el-table-column prop="name" label="属性名称" />
            <el-table-column prop="type" label="类型">
              <template #default="{ row }">
                <el-tag>{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="required" label="是否必填" width="100">
              <template #default="{ row }">
                <el-tag :type="row.required ? 'danger' : 'info'" effect="plain">
                  {{ row.required ? '必填' : '选填' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="sort" label="排序" width="80" />
            <el-table-column fixed="right" label="操作" width="150">
              <template #default="{ row }">
                <el-button link type="primary" @click="handleEditAttribute(row)">编辑</el-button>
                <el-button link type="danger" @click="handleDeleteAttribute(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 右键菜单 -->
    <el-dialog
      v-model="contextMenuVisible"
      :title="contextMenuTitle"
      width="400px"
      :style="{ position: 'fixed', left: contextMenuX + 'px', top: contextMenuY + 'px' }"
      class="context-menu-dialog"
    >
      <div class="context-menu-content">
        <el-button text @click="handleAddSubCategory">添加子分类</el-button>
        <el-button text @click="handleEditCategory">编辑分类</el-button>
        <el-button text type="danger" @click="handleDeleteCategory">删除分类</el-button>
      </div>
    </el-dialog>

    <!-- 属性编辑抽屉 -->
    <el-drawer
      v-model="attributeDrawerVisible"
      :title="attributeForm.id ? '编辑属性' : '新建属性'"
      size="600px"
      :destroy-on-close="true"
    >
      <el-form :model="attributeForm" label-width="100px">
        <el-form-item label="所属分类" required>
          <el-cascader
            v-model="attributeForm.categoryPath"
            :options="categoryData"
            :props="cascaderProps"
            clearable
          />
        </el-form-item>

        <el-form-item label="属性名称" required>
          <el-input v-model="attributeForm.name" placeholder="请输入属性名称" />
        </el-form-item>

        <el-form-item label="属性类型" required>
          <el-radio-group v-model="attributeForm.type">
            <el-radio label="text">文本</el-radio>
            <el-radio label="number">数字</el-radio>
            <el-radio label="select">单选</el-radio>
            <el-radio label="multiSelect">多选</el-radio>
            <el-radio label="image">图片</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item
          v-if="['select', 'multiSelect'].includes(attributeForm.type)"
          label="可选值"
          required
        >
          <el-input
            v-model="attributeForm.options"
            type="textarea"
            :rows="4"
            placeholder="请输入可选值，多个值用逗号分隔"
          />
        </el-form-item>

        <el-form-item label="是否必填">
          <el-switch v-model="attributeForm.required" />
        </el-form-item>

        <el-form-item label="排序">
          <el-input-number v-model="attributeForm.sort" :min="0" :max="999" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" color="#FF6F00" @click="handleSaveAttribute"> 保存 </el-button>
          <el-button @click="attributeDrawerVisible = false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 分类树数据
const categoryData = ref([
  {
    id: 1,
    label: '电子产品',
    status: 'enabled',
    children: [
      {
        id: 2,
        label: '手机',
        status: 'enabled',
        children: [
          {
            id: 3,
            label: '苹果',
            status: 'enabled',
          },
        ],
      },
    ],
  },
])

// 树配置
const defaultProps = {
  children: 'children',
  label: 'label',
}

const cascaderProps = {
  value: 'id',
  label: 'label',
  children: 'children',
  checkStrictly: true,
}

// 属性列表数据
const attributeList = ref([
  {
    id: 1,
    name: '型号',
    type: '文本',
    required: true,
    sort: 1,
  },
  {
    id: 2,
    name: '颜色',
    type: '单选',
    required: true,
    sort: 2,
  },
])

// 右键菜单相关
const contextMenuVisible = ref(false)
const contextMenuTitle = ref('')
const contextMenuX = ref(0)
const contextMenuY = ref(0)

// 属性编辑相关
const attributeDrawerVisible = ref(false)
const attributeForm = ref({
  id: '',
  categoryPath: [],
  name: '',
  type: 'text',
  options: '',
  required: false,
  sort: 0,
})

// 处理函数
const handleAddCategory = () => {
  // 实现添加一级分类逻辑
}

const handleImportCategories = () => {
  // 实现导入分类逻辑
}

const handleExportCategories = () => {
  // 实现导出分类逻辑
}

const allowDrop = (draggingNode, dropNode, type) => {
  // 实现拖拽规则
  return true
}

const handleDragEnd = (draggingNode, dropNode, dropType) => {
  // 实现拖拽结束后的处理逻辑
}

const handleContextMenu = (event, data, node) => {
  event.preventDefault()
  contextMenuVisible.value = true
  contextMenuTitle.value = `操作 - ${node.label}`
  contextMenuX.value = event.clientX
  contextMenuY.value = event.clientY
}

const handleAddSubCategory = () => {
  // 实现添加子分类逻辑
  contextMenuVisible.value = false
}

const handleEditCategory = () => {
  // 实现编辑分类逻辑
  contextMenuVisible.value = false
}

const handleDeleteCategory = () => {
  // 实现删除分类逻辑
  contextMenuVisible.value = false
}

const handleAddAttribute = () => {
  attributeForm.value = {
    id: '',
    categoryPath: [],
    name: '',
    type: 'text',
    options: '',
    required: false,
    sort: 0,
  }
  attributeDrawerVisible.value = true
}

const handleEditAttribute = (row) => {
  attributeForm.value = {
    ...row,
    categoryPath: [1, 2], // 示例路径
  }
  attributeDrawerVisible.value = true
}

const handleDeleteAttribute = (row) => {
  // 实现删除属性逻辑
}

const handleSaveAttribute = () => {
  // 实现保存属性逻辑
  attributeDrawerVisible.value = false
}
</script>

<style lang="scss" scoped>
.category-management {
  padding: 20px;

  .category-tree-card,
  .attribute-card {
    height: calc(100vh - 180px);
    overflow-y: auto;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .custom-tree-node {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;

    .node-icon {
      color: #909399;
    }

    .node-label {
      flex: 1;
    }
  }

  .context-menu-dialog {
    margin: 0;
    padding: 0;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  }

  .context-menu-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

// 响应式样式
@media screen and (max-width: 768px) {
  .category-management {
    .el-col {
      margin-bottom: 20px;
    }

    .category-tree-card,
    .attribute-card {
      height: auto;
      min-height: 400px;
    }
  }
}
</style>

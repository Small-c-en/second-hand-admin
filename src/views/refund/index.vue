<template>
  <div class="refund-processing">
    <el-row :gutter="24">
      <!-- 退款列表 -->
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <el-card class="refund-list-card">
          <template #header>
            <div class="card-header">
              <span>退款列表</span>
              <el-button-group>
                <el-button @click="handleExport">
                  <el-icon><Download /></el-icon>导出记录
                </el-button>
                <el-button @click="handleRefresh">
                  <el-icon><Refresh /></el-icon>刷新
                </el-button>
              </el-button-group>
            </div>
          </template>

          <el-table :data="refundList" style="width: 100%" :max-height="tableHeight">
            <el-table-column prop="id" label="退款ID" width="120" />
            <el-table-column prop="orderId" label="订单号" width="160" />
            <el-table-column prop="amount" label="金额" width="100">
              <template #default="{ row }"> ¥{{ row.amount.toFixed(2) }} </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column fixed="right" label="操作" width="120">
              <template #default="{ row }">
                <el-button
                  v-if="row.status === 'pending'"
                  link
                  type="primary"
                  @click="handleReview(row)"
                  >审核</el-button
                >
                <el-button
                  v-if="row.status === 'dispute'"
                  link
                  type="warning"
                  @click="handleArbitration(row)"
                  >仲裁</el-button
                >
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

      <!-- 证据验证面板 -->
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <el-card v-if="currentRefund" class="evidence-card">
          <template #header>
            <div class="card-header">
              <span>退款详情</span>
              <el-tag :type="getStatusType(currentRefund.status)">
                {{ getStatusText(currentRefund.status) }}
              </el-tag>
            </div>
          </template>

          <div class="order-info">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="商品图片">
                <el-image
                  :src="currentRefund.productImage"
                  :preview-src-list="[currentRefund.productImage]"
                  fit="cover"
                  style="width: 80px; height: 80px"
                />
              </el-descriptions-item>
              <el-descriptions-item label="商品名称">
                {{ currentRefund.productName }}
              </el-descriptions-item>
              <el-descriptions-item label="退款金额">
                <span class="amount">¥{{ currentRefund.amount.toFixed(2) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="申请时间">
                {{ currentRefund.applyTime }}
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <div class="refund-reason">
            <h4>退款原因</h4>
            <p>{{ currentRefund.reason }}</p>
          </div>

          <div class="evidence-materials">
            <h4>证据材料</h4>
            <el-tabs v-model="activeEvidence">
              <el-tab-pane label="图片" name="images">
                <el-image-viewer
                  v-if="previewVisible"
                  :url-list="currentRefund.images"
                  @close="previewVisible = false"
                />
                <div class="image-list">
                  <div
                    v-for="(image, index) in currentRefund.images"
                    :key="index"
                    class="image-item"
                    @click="handlePreviewImage(index)"
                  >
                    <el-image :src="image" fit="cover">
                      <template #error>
                        <div class="image-error">
                          <el-icon><Picture /></el-icon>
                        </div>
                      </template>
                    </el-image>
                    <div class="image-time">{{ currentRefund.imageTimes[index] }}</div>
                  </div>
                </div>
              </el-tab-pane>
              <el-tab-pane label="视频" name="videos">
                <video v-if="currentRefund.video" controls class="evidence-video">
                  <source :src="currentRefund.video" type="video/mp4" />
                </video>
              </el-tab-pane>
            </el-tabs>
          </div>

          <div v-if="currentRefund.status === 'pending'" class="review-form">
            <h4>审核意见</h4>
            <el-form :model="reviewForm" label-width="80px">
              <el-form-item label="审核结果" required>
                <el-radio-group v-model="reviewForm.result">
                  <el-radio label="approve">通过</el-radio>
                  <el-radio label="reject">拒绝</el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item v-if="reviewForm.result === 'reject'" label="拒绝原因" required>
                <el-select v-model="reviewForm.rejectReason" style="width: 100%">
                  <el-option label="证据不足" value="insufficient_evidence" />
                  <el-option label="与描述不符" value="mismatch" />
                  <el-option label="超出时限" value="timeout" />
                  <el-option label="其他原因" value="other" />
                </el-select>
              </el-form-item>

              <el-form-item label="备注">
                <el-input
                  v-model="reviewForm.comment"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入审核备注"
                />
              </el-form-item>

              <el-form-item>
                <el-button type="primary" color="#FF6F00" @click="handleSubmitReview"
                  >提交审核</el-button
                >
              </el-form-item>
            </el-form>
          </div>

          <div v-if="currentRefund.status === 'dispute'" class="chat-records">
            <h4>聊天记录</h4>
            <div class="chat-timeline">
              <el-timeline>
                <el-timeline-item
                  v-for="(chat, index) in currentRefund.chatRecords"
                  :key="index"
                  :type="chat.role === 'buyer' ? 'primary' : 'success'"
                  :timestamp="chat.time"
                >
                  <div class="chat-item">
                    <span class="chat-role">{{ chat.role === 'buyer' ? '买家' : '卖家' }}</span>
                    <div class="chat-content">{{ chat.content }}</div>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </div>
          </div>
        </el-card>

        <el-empty v-else description="请选择退款订单" />
      </el-col>
    </el-row>

    <!-- 仲裁弹窗 -->
    <el-dialog v-model="arbitrationVisible" title="退款仲裁" width="600px">
      <el-form :model="arbitrationForm" label-width="100px">
        <el-form-item label="仲裁结果" required>
          <el-radio-group v-model="arbitrationForm.result">
            <el-radio label="buyer">支持买家</el-radio>
            <el-radio label="seller">支持卖家</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="退款比例" required>
          <el-slider v-model="arbitrationForm.refundRatio" :step="10" show-stops />
          <div class="ratio-text">{{ arbitrationForm.refundRatio }}%</div>
        </el-form-item>

        <el-form-item label="仲裁说明" required>
          <el-input
            v-model="arbitrationForm.comment"
            type="textarea"
            :rows="4"
            placeholder="请输入仲裁说明"
          />
        </el-form-item>

        <el-form-item label="附件">
          <el-upload action="#" :auto-upload="false" :on-change="handleFileChange">
            <el-button type="primary">选择文件</el-button>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="arbitrationVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitArbitration"> 确认仲裁 </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// 表格高度
const tableHeight = computed(() => {
  return window.innerHeight - 300
})

// 分页相关
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(100)

// 退款列表数据
const refundList = ref([
  {
    id: 'RF2024031501',
    orderId: 'OD2024031501',
    amount: 2999.0,
    status: 'pending',
    productImage: 'https://example.com/product1.jpg',
    productName: 'iPhone 14 Pro Max',
    applyTime: '2024-03-15 10:30:00',
    reason: '商品与描述不符，屏幕有划痕',
    images: ['https://example.com/evidence1.jpg', 'https://example.com/evidence2.jpg'],
    imageTimes: ['2024-03-15 10:30:00', '2024-03-15 10:31:00'],
    video: 'https://example.com/evidence.mp4',
  },
  {
    id: 'RF2024031502',
    orderId: 'OD2024031502',
    amount: 1999.0,
    status: 'dispute',
    productImage: 'https://example.com/product2.jpg',
    productName: 'MacBook Air',
    applyTime: '2024-03-15 09:15:00',
    reason: '商品有质量问题',
    chatRecords: [
      {
        role: 'buyer',
        content: '商品收到后发现有问题',
        time: '2024-03-15 09:15:00',
      },
      {
        role: 'seller',
        content: '请提供详细说明和照片',
        time: '2024-03-15 09:20:00',
      },
    ],
  },
])

// 当前选中的退款
const currentRefund = ref(null)

// 证据相关
const activeEvidence = ref('images')
const previewVisible = ref(false)

// 审核表单
const reviewForm = ref({
  result: 'approve',
  rejectReason: '',
  comment: '',
})

// 仲裁相关
const arbitrationVisible = ref(false)
const arbitrationForm = ref({
  result: 'buyer',
  refundRatio: 100,
  comment: '',
  files: [],
})

// 状态相关方法
const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    dispute: 'danger',
    approved: 'success',
    rejected: 'info',
  }
  return types[status]
}

const getStatusText = (status) => {
  const texts = {
    pending: '待审核',
    dispute: '争议中',
    approved: '已通过',
    rejected: '已拒绝',
  }
  return texts[status]
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
  // 实现导出逻辑
}

const handleRefresh = () => {
  // 实现刷新逻辑
}

const handleReview = (row) => {
  currentRefund.value = row
  reviewForm.value = {
    result: 'approve',
    rejectReason: '',
    comment: '',
  }
}

const handleArbitration = (row) => {
  currentRefund.value = row
  arbitrationVisible.value = true
  arbitrationForm.value = {
    result: 'buyer',
    refundRatio: 100,
    comment: '',
    files: [],
  }
}

const handlePreviewImage = (index) => {
  previewVisible.value = true
}

const handleFileChange = (file) => {
  arbitrationForm.value.files.push(file)
}

const handleSubmitReview = () => {
  // 实现提交审核逻辑
}

const handleSubmitArbitration = () => {
  // 实现提交仲裁逻辑
  arbitrationVisible.value = false
}
</script>

<style lang="scss" scoped>
.refund-processing {
  padding: 20px;

  .refund-list-card,
  .evidence-card {
    height: calc(100vh - 180px);
    overflow-y: auto;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: center;
  }

  .order-info {
    margin-bottom: 20px;

    .amount {
      color: #f56c6c;
      font-weight: 500;
    }
  }

  .refund-reason {
    margin-bottom: 20px;

    h4 {
      margin-bottom: 10px;
      font-weight: 500;
    }

    p {
      color: #606266;
      line-height: 1.6;
    }
  }

  .evidence-materials {
    margin-bottom: 20px;

    h4 {
      margin-bottom: 10px;
      font-weight: 500;
    }

    .image-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 12px;
      margin-top: 12px;
    }

    .image-item {
      position: relative;
      cursor: pointer;

      .el-image {
        width: 100%;
        height: 120px;
        border-radius: 4px;
      }

      .image-time {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0, 0, 0, 0.6);
        color: white;
        font-size: 12px;
        padding: 4px;
        text-align: center;
      }

      .image-error {
        height: 120px;
        background: #f5f7fa;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #909399;
      }
    }

    .evidence-video {
      width: 100%;
      max-height: 400px;
      border-radius: 4px;
    }
  }

  .review-form {
    h4 {
      margin-bottom: 10px;
      font-weight: 500;
    }
  }

  .chat-records {
    h4 {
      margin-bottom: 10px;
      font-weight: 500;
    }

    .chat-timeline {
      padding: 20px;
      background: #f8f9fa;
      border-radius: 4px;
    }

    .chat-item {
      .chat-role {
        font-weight: 500;
        margin-right: 8px;
      }

      .chat-content {
        margin-top: 4px;
        color: #606266;
      }
    }
  }

  .ratio-text {
    text-align: center;
    margin-top: 8px;
    color: #409eff;
    font-weight: 500;
  }
}

// 响应式样式
@media screen and (max-width: 768px) {
  .refund-processing {
    .el-col {
      margin-bottom: 20px;
    }

    .refund-list-card,
    .evidence-card {
      height: auto;
      min-height: 400px;
    }

    .evidence-materials {
      .image-list {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  }
}
</style>

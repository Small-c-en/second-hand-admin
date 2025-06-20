<template>
  <el-dialog
    v-model="dialogVisible"
    title="商品详情"
    width="800px"
    destroy-on-close
    class="product-detail-dialog"
  >
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>

    <div v-else-if="product" class="product-detail">
      <!-- 基本信息区域 -->
      <div class="detail-header">
        <div class="product-title">
          <h2>{{ product.title }}</h2>
          <el-tag
            :type="reviewData.riskLevel === 'high' ? 'danger' : 'info'"
            :effect="reviewData.riskLevel === 'high' ? 'dark' : 'light'"
            class="risk-tag"
          >
            {{ reviewData.riskLevel === 'high' ? '高风险' : '普通' }}
          </el-tag>
        </div>

        <div class="product-id">
          <span>商品ID: {{ product.id }}</span>
          <span>提交时间: {{ reviewData.submitTime }}</span>
        </div>
      </div>

      <!-- 商品图片轮播 -->
      <div class="product-images">
        <el-carousel :interval="4000" type="card" height="300px">
          <el-carousel-item v-for="(image, index) in product.images" :key="index">
            <el-image
              :src="image || 'https://picsum.photos/800/600?random=' + index"
              fit="contain"
              :preview-src-list="
                product.images.length
                  ? product.images
                  : ['https://picsum.photos/800/600?random=' + index]
              "
            >
              <template #error>
                <div class="image-error">
                  <el-icon><Picture /></el-icon>
                  <span>图片加载失败</span>
                </div>
              </template>
            </el-image>
          </el-carousel-item>
        </el-carousel>
      </div>

      <!-- 商品信息和卖家信息 -->
      <div class="detail-content">
        <div class="product-info">
          <h3>商品信息</h3>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="当前价格">
              <span class="price">¥{{ product.details.currentPrice }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="原价">
              <span class="original-price">¥{{ product.details.originalPrice }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="成色">
              {{ product.details.condition }}
            </el-descriptions-item>
            <el-descriptions-item label="分类">
              {{ product.details.category }}
            </el-descriptions-item>
            <el-descriptions-item label="品牌">
              {{ product.details.brand }}
            </el-descriptions-item>
            <el-descriptions-item label="浏览量">
              {{ product.statistics.viewCount }}
            </el-descriptions-item>
            <el-descriptions-item label="收藏数">
              {{ product.statistics.favoriteCount }}
            </el-descriptions-item>
            <el-descriptions-item label="评价数">
              {{ product.statistics.reviewCount }}
            </el-descriptions-item>
          </el-descriptions>

          <div class="product-description">
            <h4>商品描述</h4>
            <div class="description-content">
              {{ product.description }}
            </div>
          </div>

          <!-- 风险提示 -->
          <div v-if="reviewData.riskLevel === 'high'" class="risk-warning">
            <el-alert
              type="warning"
              :title="reviewData.riskReason"
              :closable="false"
              show-icon
              description="请仔细审核该商品，确认是否符合平台规则。"
            />
          </div>
        </div>

        <div class="seller-info">
          <h3>卖家信息</h3>

          <div class="seller-card">
            <div class="seller-header">
              <el-avatar
                :size="64"
                :src="product.seller.avatar || 'https://picsum.photos/200?random=1'"
              />
              <div class="seller-name">
                <h4>{{ product.seller.name }}</h4>
                <div class="seller-rating">
                  <el-rate
                    v-model="product.seller.rating"
                    disabled
                    show-score
                    text-color="#ff9900"
                    score-template="{value}"
                  />
                </div>
              </div>
            </div>

            <el-divider />

            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="卖家ID">
                {{ product.seller.id }}
              </el-descriptions-item>
              <el-descriptions-item label="注册时间">
                {{ product.seller.joinDate }}
              </el-descriptions-item>
              <el-descriptions-item label="总销量">
                {{ product.seller.totalSales }} 件
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeDialog">关闭</el-button>
        <el-button type="success" @click="handleApprove" :loading="submitting">通过</el-button>
        <el-button type="danger" @click="handleReject" :loading="submitting">拒绝</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch } from 'vue'
import { Picture } from '@element-plus/icons-vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  productId: {
    type: String,
    default: '',
  },
  reviewData: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:visible', 'approve', 'reject'])

const dialogVisible = ref(false)
const loading = ref(false)
const submitting = ref(false)
const product = ref(null)

// 监听visible属性变化
watch(
  () => props.visible,
  (newVal) => {
    dialogVisible.value = newVal
    if (newVal && props.productId) {
      fetchProductDetail()
    }
  },
)

// 监听dialogVisible变化，同步回父组件
watch(dialogVisible, (newVal) => {
  emit('update:visible', newVal)
})

// 获取商品详情
const fetchProductDetail = async () => {
  loading.value = true
  try {
    // 模拟API请求
    await new Promise((resolve) => setTimeout(resolve, 800))

    // 模拟数据
    product.value = {
      id: props.productId || 'prod-123456',
      title: props.reviewData.title || '商品标题',
      images: props.reviewData.image
        ? [props.reviewData.image]
        : [
            'https://picsum.photos/800/600?random=1',
            'https://picsum.photos/800/600?random=2',
            'https://picsum.photos/800/600?random=3',
          ],
      description:
        '这是一段商品详细描述。这件商品状态良好，几乎全新。卖家精心保管，无明显使用痕迹。适合追求高品质二手商品的买家。这件商品性价比极高，是同类产品中的优质选择。',
      details: {
        currentPrice: props.reviewData.price || '299.00',
        originalPrice: '399.00',
        condition: '9成新',
        category: props.reviewData.category || '电子产品',
        brand: '品牌名称',
      },
      seller: {
        id: 'seller-123',
        name: props.reviewData.seller || '卖家名称',
        avatar: 'https://picsum.photos/200?random=1',
        rating: 4.8,
        totalSales: 1000,
        joinDate: '2023-01-01',
      },
      statistics: {
        viewCount: 1000,
        favoriteCount: 100,
        reviewCount: 50,
        averageRating: 4.5,
      },
    }
  } catch (error) {
    console.error('获取商品详情失败:', error)
  } finally {
    loading.value = false
  }
}

// 关闭弹窗
const closeDialog = () => {
  dialogVisible.value = false
}

// 通过商品
const handleApprove = () => {
  submitting.value = true
  setTimeout(() => {
    emit('approve', props.productId)
    submitting.value = false
    closeDialog()
  }, 800)
}

// 拒绝商品
const handleReject = () => {
  emit('reject', props.productId)
  closeDialog()
}
</script>

<style lang="scss" scoped>
.product-detail-dialog {
  :deep(.el-dialog__body) {
    padding: 0;
  }

  .loading-container {
    padding: 30px;
  }

  .product-detail {
    .detail-header {
      padding: 20px;
      border-bottom: 1px solid #ebeef5;

      .product-title {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;

        h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #303133;
        }

        .risk-tag {
          padding: 6px 10px;
          font-size: 14px;
        }
      }

      .product-id {
        display: flex;
        justify-content: space-between;
        color: #909399;
        font-size: 14px;
      }
    }

    .product-images {
      padding: 20px;
      background-color: #f5f7fa;

      :deep(.el-carousel__item) {
        display: flex;
        justify-content: center;
        align-items: center;

        .el-image {
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;

          img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }
        }
      }

      .image-error {
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
    }

    .detail-content {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 20px;
      padding: 20px;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }

      .product-info {
        h3 {
          margin-top: 0;
          margin-bottom: 16px;
          font-size: 18px;
          font-weight: 600;
          color: #303133;
        }

        .price {
          color: #f56c6c;
          font-size: 18px;
          font-weight: 600;
        }

        .original-price {
          color: #909399;
          text-decoration: line-through;
          margin-left: 8px;
        }

        .product-description {
          margin-top: 20px;

          h4 {
            margin-top: 0;
            margin-bottom: 12px;
            font-size: 16px;
            font-weight: 500;
            color: #303133;
          }

          .description-content {
            background-color: #f9fafc;
            padding: 16px;
            border-radius: 4px;
            color: #606266;
            line-height: 1.6;
          }
        }

        .risk-warning {
          margin-top: 20px;
        }
      }

      .seller-info {
        h3 {
          margin-top: 0;
          margin-bottom: 16px;
          font-size: 18px;
          font-weight: 600;
          color: #303133;
        }

        .seller-card {
          background-color: #f9fafc;
          border-radius: 8px;
          padding: 16px;

          .seller-header {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 16px;

            .seller-name {
              h4 {
                margin: 0 0 8px 0;
                font-size: 16px;
                font-weight: 500;
              }
            }
          }
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 10px 0;
  }
}
</style>

<!-- 系统设置页面 -->
<template>
  <div class="setting-container">
    <el-card class="setting-card">
      <el-tabs v-model="activeTab" class="setting-tabs" tab-position="left">
        <!-- 基本设置 -->
        <el-tab-pane label="基本设置" name="basic">
          <div class="tab-header">
            <h2>基本设置</h2>
            <p class="tab-description">配置系统的基本信息，如系统名称、Logo等</p>
          </div>
          <el-form
            ref="basicFormRef"
            :model="basicForm"
            :rules="basicRules"
            label-width="120px"
            class="setting-form"
          >
            <el-form-item label="系统名称" prop="systemName">
              <el-input v-model="basicForm.systemName" placeholder="请输入系统名称" />
            </el-form-item>
            <el-form-item label="系统Logo">
              <div class="upload-container">
                <el-upload
                  class="logo-uploader"
                  action="/api/upload"
                  :show-file-list="false"
                  :before-upload="beforeLogoUpload"
                  :on-success="handleLogoSuccess"
                >
                  <img v-if="basicForm.logo" :src="basicForm.logo" class="logo" />
                  <div v-else class="upload-placeholder">
                    <el-icon><Plus /></el-icon>
                    <div class="upload-text">点击上传Logo</div>
                  </div>
                </el-upload>
                <div class="upload-tip">建议尺寸：200x50px，支持 jpg、png 格式</div>
              </div>
            </el-form-item>
            <el-form-item label="系统描述" prop="description">
              <el-input
                v-model="basicForm.description"
                type="textarea"
                :rows="3"
                placeholder="请输入系统描述"
              />
            </el-form-item>
            <el-form-item label="备案信息" prop="icp">
              <el-input v-model="basicForm.icp" placeholder="请输入备案信息" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveBasicSettings">保存设置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 交易设置 -->
        <el-tab-pane label="交易设置" name="trade">
          <div class="tab-header">
            <h2>交易设置</h2>
            <p class="tab-description">配置商品审核、交易佣金等交易相关参数</p>
          </div>
          <el-form
            ref="tradeFormRef"
            :model="tradeForm"
            :rules="tradeRules"
            label-width="120px"
            class="setting-form"
          >
            <el-card class="setting-section" shadow="never">
              <template #header>
                <div class="section-header">
                  <span>商品管理</span>
                </div>
              </template>
              <el-form-item label="商品审核" prop="productAudit">
                <el-switch
                  v-model="tradeForm.productAudit"
                  active-text="开启"
                  inactive-text="关闭"
                />
              </el-form-item>
              <el-form-item label="最大上架数量" prop="maxProducts">
                <el-input-number
                  v-model="tradeForm.maxProducts"
                  :min="1"
                  :max="1000"
                  placeholder="请输入最大上架数量"
                />
                <span class="form-tip">每个用户最多可上架的商品数量</span>
              </el-form-item>
            </el-card>

            <el-card class="setting-section" shadow="never">
              <template #header>
                <div class="section-header">
                  <span>交易规则</span>
                </div>
              </template>
              <el-form-item label="交易佣金比例" prop="commission">
                <el-input-number
                  v-model="tradeForm.commission"
                  :min="0"
                  :max="100"
                  :precision="2"
                  :step="0.01"
                  placeholder="请输入佣金比例"
                />
                <span class="form-tip">%</span>
              </el-form-item>
              <el-form-item label="自动确认收货" prop="autoConfirmDays">
                <el-input-number
                  v-model="tradeForm.autoConfirmDays"
                  :min="1"
                  :max="30"
                  placeholder="请输入天数"
                />
                <span class="form-tip">天后自动确认收货</span>
              </el-form-item>
              <el-form-item label="退款期限" prop="refundDays">
                <el-input-number
                  v-model="tradeForm.refundDays"
                  :min="1"
                  :max="30"
                  placeholder="请输入天数"
                />
                <span class="form-tip">天内可申请退款</span>
              </el-form-item>
            </el-card>

            <el-form-item>
              <el-button type="primary" @click="saveTradeSettings">保存设置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 支付设置 -->
        <el-tab-pane label="支付设置" name="payment">
          <div class="tab-header">
            <h2>支付设置</h2>
            <p class="tab-description">配置支付宝、微信支付等支付方式</p>
          </div>
          <el-form
            ref="paymentFormRef"
            :model="paymentForm"
            :rules="paymentRules"
            label-width="120px"
            class="setting-form"
          >
            <el-card class="setting-section payment-section" shadow="never">
              <template #header>
                <div class="section-header">
                  <span>支付宝</span>
                  <el-switch v-model="paymentForm.alipayEnabled" />
                </div>
              </template>
              <div class="section-content" :class="{ disabled: !paymentForm.alipayEnabled }">
                <el-form-item label="AppID" prop="alipayAppId">
                  <el-input
                    v-model="paymentForm.alipayAppId"
                    placeholder="请输入支付宝AppID"
                    :disabled="!paymentForm.alipayEnabled"
                  />
                </el-form-item>
                <el-form-item label="商户私钥" prop="alipayPrivateKey">
                  <el-input
                    v-model="paymentForm.alipayPrivateKey"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入商户私钥"
                    :disabled="!paymentForm.alipayEnabled"
                  />
                </el-form-item>
                <el-form-item label="支付宝公钥" prop="alipayPublicKey">
                  <el-input
                    v-model="paymentForm.alipayPublicKey"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入支付宝公钥"
                    :disabled="!paymentForm.alipayEnabled"
                  />
                </el-form-item>
              </div>
            </el-card>

            <el-card class="setting-section payment-section" shadow="never">
              <template #header>
                <div class="section-header">
                  <span>微信支付</span>
                  <el-switch v-model="paymentForm.wechatEnabled" />
                </div>
              </template>
              <div class="section-content" :class="{ disabled: !paymentForm.wechatEnabled }">
                <el-form-item label="AppID" prop="wechatAppId">
                  <el-input
                    v-model="paymentForm.wechatAppId"
                    placeholder="请输入微信AppID"
                    :disabled="!paymentForm.wechatEnabled"
                  />
                </el-form-item>
                <el-form-item label="商户号" prop="wechatMchId">
                  <el-input
                    v-model="paymentForm.wechatMchId"
                    placeholder="请输入商户号"
                    :disabled="!paymentForm.wechatEnabled"
                  />
                </el-form-item>
                <el-form-item label="API密钥" prop="wechatApiKey">
                  <el-input
                    v-model="paymentForm.wechatApiKey"
                    placeholder="请输入API密钥"
                    :disabled="!paymentForm.wechatEnabled"
                    show-password
                  />
                </el-form-item>
              </div>
            </el-card>

            <el-form-item>
              <el-button type="primary" @click="savePaymentSettings">保存设置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 通知设置 -->
        <el-tab-pane label="通知设置" name="notification">
          <div class="tab-header">
            <h2>通知设置</h2>
            <p class="tab-description">配置邮件、短信等通知方式</p>
          </div>
          <el-form
            ref="notificationFormRef"
            :model="notificationForm"
            :rules="notificationRules"
            label-width="120px"
            class="setting-form"
          >
            <el-card class="setting-section notification-section" shadow="never">
              <template #header>
                <div class="section-header">
                  <span>邮件服务</span>
                  <el-switch v-model="notificationForm.emailEnabled" />
                </div>
              </template>
              <div class="section-content" :class="{ disabled: !notificationForm.emailEnabled }">
                <el-form-item label="SMTP服务器" prop="smtpHost">
                  <el-input
                    v-model="notificationForm.smtpHost"
                    placeholder="请输入SMTP服务器地址"
                    :disabled="!notificationForm.emailEnabled"
                  />
                </el-form-item>
                <el-form-item label="SMTP端口" prop="smtpPort">
                  <el-input-number
                    v-model="notificationForm.smtpPort"
                    :min="1"
                    :max="65535"
                    placeholder="请输入SMTP端口"
                    :disabled="!notificationForm.emailEnabled"
                  />
                </el-form-item>
                <el-form-item label="发件人邮箱" prop="smtpUsername">
                  <el-input
                    v-model="notificationForm.smtpUsername"
                    placeholder="请输入发件人邮箱"
                    :disabled="!notificationForm.emailEnabled"
                  />
                </el-form-item>
                <el-form-item label="邮箱密码" prop="smtpPassword">
                  <el-input
                    v-model="notificationForm.smtpPassword"
                    type="password"
                    placeholder="请输入邮箱密码"
                    :disabled="!notificationForm.emailEnabled"
                    show-password
                  />
                </el-form-item>
              </div>
            </el-card>

            <el-card class="setting-section notification-section" shadow="never">
              <template #header>
                <div class="section-header">
                  <span>短信服务</span>
                  <el-switch v-model="notificationForm.smsEnabled" />
                </div>
              </template>
              <div class="section-content" :class="{ disabled: !notificationForm.smsEnabled }">
                <el-form-item label="服务商" prop="smsProvider">
                  <el-select
                    v-model="notificationForm.smsProvider"
                    placeholder="请选择短信服务商"
                    :disabled="!notificationForm.smsEnabled"
                  >
                    <el-option label="阿里云" value="aliyun" />
                    <el-option label="腾讯云" value="tencent" />
                  </el-select>
                </el-form-item>
                <el-form-item label="AccessKey" prop="smsAccessKey">
                  <el-input
                    v-model="notificationForm.smsAccessKey"
                    placeholder="请输入AccessKey"
                    :disabled="!notificationForm.smsEnabled"
                  />
                </el-form-item>
                <el-form-item label="SecretKey" prop="smsSecretKey">
                  <el-input
                    v-model="notificationForm.smsSecretKey"
                    placeholder="请输入SecretKey"
                    :disabled="!notificationForm.smsEnabled"
                    show-password
                  />
                </el-form-item>
                <el-form-item label="短信签名" prop="smsSignName">
                  <el-input
                    v-model="notificationForm.smsSignName"
                    placeholder="请输入短信签名"
                    :disabled="!notificationForm.smsEnabled"
                  />
                </el-form-item>
              </div>
            </el-card>

            <el-form-item>
              <el-button type="primary" @click="saveNotificationSettings">保存设置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 当前激活的标签页
const activeTab = ref('basic')

// 基本设置表单
const basicFormRef = ref(null)
const basicForm = reactive({
  systemName: '二手交易平台',
  logo: '',
  description: '',
  icp: '',
})
const basicRules = {
  systemName: [
    { required: true, message: '请输入系统名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' },
  ],
  description: [{ max: 200, message: '长度不能超过 200 个字符', trigger: 'blur' }],
}

// 交易设置表单
const tradeFormRef = ref(null)
const tradeForm = reactive({
  productAudit: true,
  maxProducts: 100,
  commission: 5,
  autoConfirmDays: 7,
  refundDays: 7,
})
const tradeRules = {
  maxProducts: [{ required: true, message: '请输入最大上架数量', trigger: 'blur' }],
  commission: [{ required: true, message: '请输入佣金比例', trigger: 'blur' }],
  autoConfirmDays: [{ required: true, message: '请输入自动确认收货天数', trigger: 'blur' }],
  refundDays: [{ required: true, message: '请输入退款期限', trigger: 'blur' }],
}

// 支付设置表单
const paymentFormRef = ref(null)
const paymentForm = reactive({
  alipayEnabled: false,
  alipayAppId: '',
  alipayPrivateKey: '',
  alipayPublicKey: '',
  wechatEnabled: false,
  wechatAppId: '',
  wechatMchId: '',
  wechatApiKey: '',
})
const paymentRules = {
  alipayAppId: [
    {
      required: true,
      message: '请输入支付宝AppID',
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (paymentForm.alipayEnabled && !value) {
          callback(new Error('请输入支付宝AppID'))
        } else {
          callback()
        }
      },
    },
  ],
  alipayPrivateKey: [
    {
      required: true,
      message: '请输入商户私钥',
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (paymentForm.alipayEnabled && !value) {
          callback(new Error('请输入商户私钥'))
        } else {
          callback()
        }
      },
    },
  ],
  alipayPublicKey: [
    {
      required: true,
      message: '请输入支付宝公钥',
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (paymentForm.alipayEnabled && !value) {
          callback(new Error('请输入支付宝公钥'))
        } else {
          callback()
        }
      },
    },
  ],
  wechatAppId: [
    {
      required: true,
      message: '请输入微信AppID',
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (paymentForm.wechatEnabled && !value) {
          callback(new Error('请输入微信AppID'))
        } else {
          callback()
        }
      },
    },
  ],
  wechatMchId: [
    {
      required: true,
      message: '请输入商户号',
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (paymentForm.wechatEnabled && !value) {
          callback(new Error('请输入商户号'))
        } else {
          callback()
        }
      },
    },
  ],
  wechatApiKey: [
    {
      required: true,
      message: '请输入API密钥',
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (paymentForm.wechatEnabled && !value) {
          callback(new Error('请输入API密钥'))
        } else {
          callback()
        }
      },
    },
  ],
}

// 通知设置表单
const notificationFormRef = ref(null)
const notificationForm = reactive({
  emailEnabled: false,
  smtpHost: '',
  smtpPort: 465,
  smtpUsername: '',
  smtpPassword: '',
  smsEnabled: false,
  smsProvider: '',
  smsAccessKey: '',
  smsSecretKey: '',
  smsSignName: '',
})
const notificationRules = {
  smtpHost: [
    {
      required: true,
      message: '请输入SMTP服务器地址',
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (notificationForm.emailEnabled && !value) {
          callback(new Error('请输入SMTP服务器地址'))
        } else {
          callback()
        }
      },
    },
  ],
  smtpPort: [
    {
      required: true,
      message: '请输入SMTP端口',
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (notificationForm.emailEnabled && !value) {
          callback(new Error('请输入SMTP端口'))
        } else {
          callback()
        }
      },
    },
  ],
  smtpUsername: [
    {
      required: true,
      message: '请输入发件人邮箱',
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (notificationForm.emailEnabled && !value) {
          callback(new Error('请输入发件人邮箱'))
        } else {
          callback()
        }
      },
    },
  ],
  smtpPassword: [
    {
      required: true,
      message: '请输入邮箱密码',
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (notificationForm.emailEnabled && !value) {
          callback(new Error('请输入邮箱密码'))
        } else {
          callback()
        }
      },
    },
  ],
  smsProvider: [
    {
      required: true,
      message: '请选择短信服务商',
      trigger: 'change',
      validator: (rule, value, callback) => {
        if (notificationForm.smsEnabled && !value) {
          callback(new Error('请选择短信服务商'))
        } else {
          callback()
        }
      },
    },
  ],
  smsAccessKey: [
    {
      required: true,
      message: '请输入AccessKey',
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (notificationForm.smsEnabled && !value) {
          callback(new Error('请输入AccessKey'))
        } else {
          callback()
        }
      },
    },
  ],
  smsSecretKey: [
    {
      required: true,
      message: '请输入SecretKey',
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (notificationForm.smsEnabled && !value) {
          callback(new Error('请输入SecretKey'))
        } else {
          callback()
        }
      },
    },
  ],
  smsSignName: [
    {
      required: true,
      message: '请输入短信签名',
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (notificationForm.smsEnabled && !value) {
          callback(new Error('请输入短信签名'))
        } else {
          callback()
        }
      },
    },
  ],
}

// Logo上传前校验
const beforeLogoUpload = (file) => {
  const isJPG = file.type === 'image/jpeg'
  const isPNG = file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG && !isPNG) {
    ElMessage.error('上传Logo只能是 JPG 或 PNG 格式!')
  }
  if (!isLt2M) {
    ElMessage.error('上传Logo大小不能超过 2MB!')
  }
  return (isJPG || isPNG) && isLt2M
}

// Logo上传成功回调
const handleLogoSuccess = (res) => {
  basicForm.logo = res.url
}

// 保存基本设置
const saveBasicSettings = async () => {
  if (!basicFormRef.value) return
  await basicFormRef.value.validate((valid) => {
    if (valid) {
      // TODO: 实现保存逻辑
      ElMessage.success('保存成功')
    }
  })
}

// 保存交易设置
const saveTradeSettings = async () => {
  if (!tradeFormRef.value) return
  await tradeFormRef.value.validate((valid) => {
    if (valid) {
      // TODO: 实现保存逻辑
      ElMessage.success('保存成功')
    }
  })
}

// 保存支付设置
const savePaymentSettings = async () => {
  if (!paymentFormRef.value) return
  await paymentFormRef.value.validate((valid) => {
    if (valid) {
      // TODO: 实现保存逻辑
      ElMessage.success('保存成功')
    }
  })
}

// 保存通知设置
const saveNotificationSettings = async () => {
  if (!notificationFormRef.value) return
  await notificationFormRef.value.validate((valid) => {
    if (valid) {
      // TODO: 实现保存逻辑
      ElMessage.success('保存成功')
    }
  })
}
</script>

<style scoped>
.setting-container {
  padding: 20px;
  min-height: calc(100vh - 84px);
  background-color: #f0f2f5;
}

.setting-card {
  min-height: calc(100vh - 124px);
  margin-bottom: 20px;
}

.setting-tabs {
  height: 100%;
}

.setting-tabs :deep(.el-tabs__header) {
  margin-right: 30px;
  padding: 20px 0;
}

.setting-tabs :deep(.el-tabs__nav) {
  width: 200px;
}

.setting-tabs :deep(.el-tabs__item) {
  height: 50px;
  line-height: 50px;
  text-align: left;
  padding-left: 20px !important;
  font-size: 14px;
  color: #606266;
  transition: all 0.3s;

  &.is-active {
    background-color: #fff3e0;
    color: #ff6f00;
    font-weight: 500;
  }

  &:hover {
    color: #ff6f00;
  }
}

.tab-header {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;

  h2 {
    font-size: 20px;
    font-weight: 500;
    color: #2c3e50;
    margin-bottom: 8px;
  }
}

.tab-description {
  font-size: 14px;
  color: #909399;
}

.setting-form {
  max-width: 800px;
  padding: 0 20px;
}

.setting-section {
  margin-bottom: 24px;
  border-radius: 8px;
  border: 1px solid #ebeef5;

  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid #ebeef5;
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
  color: #2c3e50;
}

.section-content {
  padding: 20px;
  transition: all 0.3s;

  &.disabled {
    opacity: 0.6;
    filter: grayscale(20%);
  }
}

.upload-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.logo-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 200px;
  height: 50px;
  transition: all 0.3s;

  &:hover {
    border-color: #ff6f00;
  }
}

.upload-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #909399;

  .el-icon {
    font-size: 24px;
    margin-bottom: 4px;
  }

  .upload-text {
    font-size: 12px;
  }
}

.logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.upload-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.form-tip {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
}

:deep(.el-input-number) {
  width: 180px;
}

:deep(.el-select) {
  width: 180px;
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .setting-form {
    max-width: 100%;
  }
}

@media (max-width: 768px) {
  .setting-tabs :deep(.el-tabs__nav) {
    width: 160px;
  }

  .setting-tabs :deep(.el-tabs__header) {
    margin-right: 20px;
  }
}
</style>

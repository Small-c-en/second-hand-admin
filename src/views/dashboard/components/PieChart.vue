<!-- 商品分类占比饼图组件 -->
<template>
  <div ref="chartRef" class="chart"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'

// 定义props
const props = defineProps({
  data: {
    type: Array,
    required: true,
    default: () => [],
  },
})

// 图表实例
let chartInstance = null
const chartRef = ref(null)

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return

  chartInstance = echarts.init(chartRef.value)
  setOptions()
}

// 设置图表配置
const setOptions = () => {
  // 图表配置项
  const options = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#e6e6e6',
      borderWidth: 1,
      padding: [8, 12],
      textStyle: {
        color: '#333',
        fontSize: 14,
      },
      formatter: (params) => {
        return `
          <div style="padding: 8px">
            <div style="margin-bottom: 8px; color: #606266">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${
                params.color
              }; margin-right: 8px;"></span>
              ${params.name}
            </div>
            <div style="font-weight: 500; font-size: 16px; color: #303133">${params.value}%</div>
          </div>
        `
      },
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'middle',
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 16,
      icon: 'circle',
      formatter: (name) => {
        const item = props.data.find((i) => i.name === name)
        const value = item ? item.value : 0
        return [`{name|${name}}`, `{value|${value}%}`].join('  ')
      },
      textStyle: {
        rich: {
          name: {
            color: '#606266',
            fontSize: 14,
            width: 60,
          },
          value: {
            color: '#303133',
            fontSize: 14,
            fontWeight: 500,
            padding: [0, 0, 0, 8],
          },
        },
      },
      pageIconColor: '#ff6f00',
      pageTextStyle: {
        color: '#606266',
      },
    },
    series: [
      {
        name: '分类占比',
        type: 'pie',
        radius: ['45%', '65%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
          emphasis: {
            show: true,
            fontSize: 24,
            fontWeight: 500,
            color: '#303133',
            formatter: (params) => `${params.value}%`,
          },
        },
        labelLine: {
          show: false,
        },
        emphasis: {
          scale: true,
          scaleSize: 10,
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.2)',
          },
        },
        data: props.data.map((item) => ({
          name: item.name,
          value: item.value,
          itemStyle: {
            color: getColor(item.name),
          },
        })),
      },
    ],
  }

  chartInstance.setOption(options)
}

// 获取颜色
const getColor = (name) => {
  const colors = {
    电子产品: '#ff6f00',
    服饰: '#2ecc71',
    家居: '#3498db',
    其他: '#95a5a6',
  }
  return colors[name] || '#95a5a6'
}

// 监听数据变化
watch(
  () => props.data,
  () => {
    setOptions()
  },
  { deep: true },
)

// 监听窗口大小变化
const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

// 生命周期钩子
onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.chart {
  width: 100%;
  height: 100%;
  padding: 0;
}
</style>

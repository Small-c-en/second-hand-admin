<!-- 交易趋势折线图组件 -->
<template>
  <div ref="chartRef" class="chart"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'

// 定义props
const props = defineProps({
  data: {
    type: Object,
    required: true,
    default: () => ({
      dates: [],
      values: [],
    }),
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
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#e6e6e6',
      borderWidth: 1,
      padding: [8, 12],
      textStyle: {
        color: '#333',
        fontSize: 14,
      },
      formatter: (params) => {
        const [data] = params
        return `
          <div style="padding: 8px">
            <div style="margin-bottom: 8px; color: #606266">${data.name}</div>
            <div style="font-weight: 500; font-size: 16px; color: #303133">¥${data.value.toLocaleString()}</div>
          </div>
        `
      },
    },
    grid: {
      top: '8%',
      left: '3%',
      right: '4%',
      bottom: '12%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: props.data.dates,
      axisLine: {
        lineStyle: {
          color: '#dcdfe6',
        },
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        margin: 12,
        color: '#606266',
        fontSize: 12,
      },
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      splitLine: {
        lineStyle: {
          color: '#ebeef5',
          type: 'dashed',
        },
      },
      axisLabel: {
        color: '#606266',
        fontSize: 12,
        formatter: (value) => {
          return '¥' + value.toLocaleString()
        },
      },
    },
    series: [
      {
        name: '交易额',
        type: 'line',
        smooth: true,
        data: props.data.values,
        symbolSize: 8,
        symbol: 'circle',
        showSymbol: false,
        emphasis: {
          scale: true,
          focus: 'series',
          itemStyle: {
            color: '#ff6f00',
            borderColor: '#fff',
            borderWidth: 2,
            shadowColor: 'rgba(0, 0, 0, 0.2)',
            shadowBlur: 10,
          },
        },
        itemStyle: {
          color: '#ff6f00',
          borderColor: '#fff',
          borderWidth: 2,
        },
        lineStyle: {
          width: 3,
          color: '#ff6f00',
          shadowColor: 'rgba(255, 111, 0, 0.2)',
          shadowBlur: 10,
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: 'rgba(255, 111, 0, 0.3)',
            },
            {
              offset: 1,
              color: 'rgba(255, 111, 0, 0.05)',
            },
          ]),
        },
      },
    ],
  }

  chartInstance.setOption(options)
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

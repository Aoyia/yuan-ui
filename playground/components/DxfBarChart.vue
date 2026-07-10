<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { z } from 'zod'
import * as echarts from 'echarts'
import { BarChart3, CheckCircle2, AlertTriangle, Zap } from '@lucide/vue'

const props = defineProps<{
  dataset: string
}>()

const emit = defineEmits<{
  (e: 'feedback', msg: string): void
}>()

const chartRef = ref<HTMLElement | null>(null)
const errorMsg = ref<string | null>(null)
const parsedData = ref<any>(null)
let chartInstance: echarts.ECharts | null = null

// 校验 JSON 与 Zod 逻辑
watch(() => props.dataset, (newVal) => {
  if (!newVal) return
  try {
    const rawJson = JSON.parse(newVal)
    const barChartSchema = z.object({
      title: z.string({ message: "「title」必须是字符串" }),
      values: z.array(z.number(), { message: "「values」必须是数字数组" })
    })
    const result = barChartSchema.safeParse(rawJson)
    if (result.success) {
      parsedData.value = result.data
      errorMsg.value = null
      // 数据校验通过，下个 Tick 更新/重新渲染 ECharts
      nextTick(() => {
        renderChart()
      })
    } else {
      errorMsg.value = result.error.issues.map(issue => `字段 ${issue.path.join('.') || 'root'}: ${issue.message}`).join(' | ')
    }
  } catch (e: any) {
    errorMsg.value = `JSON 解析失败: ${e.message}`
  }
}, { immediate: true })

const renderChart = () => {
  if (!chartRef.value || !parsedData.value) return

  // 初始化 echarts
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  const categories = parsedData.value.values.map((_: any, idx: number) => `Q${idx + 1}`)
  
  const option = {
    title: {
      text: parsedData.value.title,
      textStyle: {
        fontSize: 13,
        fontWeight: '600',
        color: 'var(--yuan-text-primary)'
      },
      left: 'center',
      top: 0
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1f2937',
      borderWidth: 0,
      textStyle: {
        color: '#fff',
        fontSize: 12
      },
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      top: '20%',
      left: '5%',
      right: '5%',
      bottom: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLine: {
        lineStyle: {
          color: 'var(--yuan-border)'
        }
      },
      axisLabel: {
        color: 'var(--yuan-text-tertiary)',
        fontSize: 11
      }
    },
    yAxis: {
      type: 'value',
      splitLine: {
        lineStyle: {
          color: 'var(--yuan-border-light)',
          type: 'dashed'
        }
      },
      axisLabel: {
        color: 'var(--yuan-text-tertiary)',
        fontSize: 11
      }
    },
    series: [
      {
        data: parsedData.value.values,
        type: 'bar',
        barWidth: '35%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#3b82f6' }, // 蓝色渐变
            { offset: 1, color: '#10b981' }  // 绿色渐变
          ]),
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  }

  chartInstance.setOption(option)
}

onMounted(() => {
  renderChart()
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize)
  }
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleResize)
  }
})

const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}
</script>

<template>
  <div v-if="errorMsg" class="error-panel">
    <div class="error-header" style="display: flex; align-items: center; gap: 6px;">
      <AlertTriangle style="width: 14px; height: 14px; color: var(--yuan-error);" />
      <span>运行时校验失败 (Zod Schema Validation Fail)</span>
    </div>
    <div class="error-body">{{ errorMsg }}</div>
    <div class="error-actions">
      <button
        style="
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid var(--yuan-error);
          color: var(--yuan-error);
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        "
        @click="emit('feedback', errorMsg!)"
      >
        <Zap style="width: 12px; height: 12px;" />
        <span>结构化报错回喂（触发 AI 自我纠错）</span>
      </button>
    </div>
  </div>

  <div v-else class="custom-chart-container">
    <div class="chart-header" style="display: flex; align-items: center; gap: 6px;">
      <BarChart3 style="width: 14px; height: 14px; color: var(--yuan-primary);" />
      <span>ECharts AI 柱状图组件 (DxfBarChart)</span>
      <span
        style="
          font-size: 11px;
          color: var(--yuan-success);
          background: var(--yuan-success-light);
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid var(--yuan-border);
          margin-left: 8px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        "
      >
        <CheckCircle2 style="width: 10px; height: 10px; color: var(--yuan-success);" />
        <span>Zod & ECharts 渲染就绪</span>
      </span>
    </div>
    <div
      ref="chartRef"
      style="
        width: 100%;
        height: 240px;
        margin-top: 12px;
      "
    />
  </div>
</template>

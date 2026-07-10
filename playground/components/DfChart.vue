<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { z } from 'zod'
import * as echarts from 'echarts'
import { AlertTriangle, Zap } from '@lucide/vue'

const props = defineProps<{
  dataset: string
  tag?: string
}>()

const emit = defineEmits<{
  (e: 'feedback', msg: string): void
}>()

const chartRef = ref<HTMLElement | null>(null)
const errorMsg = ref<string | null>(null)
const parsedData = ref<any>(null)
let chartInstance: echarts.ECharts | null = null

// 校验 JSON 与 Zod 逻辑，当数据或组件 tag 发生变化时触发
watch(() => [props.dataset, props.tag], () => {
  const newVal = props.dataset
  if (!newVal) return
  try {
    const rawJson = JSON.parse(newVal)
    const isRadar = props.tag === 'df-radar-chart'

    // 根据 tag 类型选用不同的 Zod Schema 强校对
    const schema = isRadar
      ? z.object({
          title: z.string({ message: "「title」必须是字符串" }),
          indicators: z.array(z.object({
            name: z.string({ message: "indicator「name」必须是字符串" }),
            max: z.number({ message: "indicator「max」必须是数值" })
          }), { message: "「indicators」必须是维度指标数组" }),
          values: z.array(z.number(), { message: "「values」能力数值必须是数字数组" })
        })
      : z.object({
          title: z.string({ message: "「title」必须是字符串" }),
          values: z.array(z.number(), { message: "「values」必须是数字数组" })
        })

    const result = schema.safeParse(rawJson)
    if (result.success) {
      parsedData.value = result.data
      errorMsg.value = null
      // 校验成功，下个 Tick 更新/渲染 ECharts
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

  // 初始化或复用 ECharts 实例
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  const isRadar = props.tag === 'df-radar-chart'
  let option: any = {}

  if (isRadar) {
    // 1. 高端 AI 维度雷达图设计
    option = {
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
        trigger: 'item',
        backgroundColor: '#1f2937',
        borderWidth: 0,
        textStyle: {
          color: '#fff',
          fontSize: 12
        }
      },
      radar: {
        indicator: parsedData.value.indicators,
        shape: 'polygon',
        splitNumber: 4,
        axisName: {
          color: 'var(--yuan-text-secondary)',
          fontSize: 11
        },
        splitLine: {
          lineStyle: {
            color: 'var(--yuan-border-light)'
          }
        },
        splitArea: {
          areaStyle: {
            color: ['rgba(255, 255, 255, 0.01)', 'rgba(0, 0, 0, 0.02)']
          }
        },
        axisLine: {
          lineStyle: {
            color: 'var(--yuan-border)'
          }
        }
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: parsedData.value.values,
              name: parsedData.value.title,
              areaStyle: {
                color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
                  { offset: 0, color: 'rgba(59, 130, 246, 0.1)' },
                  { offset: 1, color: 'rgba(59, 130, 246, 0.4)' }
                ])
              },
              lineStyle: {
                color: '#3b82f6',
                width: 2
              },
              itemStyle: {
                color: '#10b981'
              }
            }
          ]
        }
      ]
    }
  } else {
    // 2. 原生 ECharts 柱状图设计
    const categories = parsedData.value.values.map((_: any, idx: number) => `Q${idx + 1}`)
    option = {
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
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: '#10b981' }
            ]),
            borderRadius: [4, 4, 0, 0]
          }
        }
      ]
    }
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
    <div
      ref="chartRef"
      style="
        width: 100%;
        height: 240px;
      "
    />
  </div>
</template>

<template>
  <div ref="chart" class="rounded overflow-hidden border-2 border-gray-100 dark:border-gray-600"/>
</template>

<script>
import { createChart } from 'lightweight-charts'
import { useMainStore } from '@/stores/main'
import { mapWritableState } from 'pinia'
import helpers from '@/helpers'

let chart = null
let lineSeries = []

// Color palette for multiple equity curves
const colors = [
  '#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
  '#84cc16', '#a855f7', '#22d3ee', '#fb7185', '#34d399'
]

export default {
  name: 'ScenarioChart',
  props: {
    equityCurves: {
      type: Array,
      required: true,
      default: () => []
    },
    maxCurves: {
      type: Number,
      default: 50
    }
  },
  data () {
    return {
      settings: {
        width: 800,
        height: 400,
        priceScale: {
          borderColor: 'rgba(197, 203, 206, 1)'
        },
        timeScale: {
          borderColor: 'rgba(197, 203, 206, 1)',
          timeVisible: true,
          secondsVisible: false
        }
      },
      lightTheme: {
        chart: {
          layout: {
            backgroundColor: '#ffffff',
            textColor: 'rgba(33, 56, 77, 1)'
          },
          grid: {
            vertLines: {
              color: '#f1f1f1',
            },
            horzLines: {
              color: '#f1f1f1',
            }
          },
          priceScale: {
            borderColor: 'rgba(197, 203, 206, 0.6)'
          },
          timeScale: {
            borderColor: 'rgba(197, 203, 206, 0.6)',
            timeVisible: true,
            secondsVisible: false
          }
        }
      },
      darkTheme: {
        chart: {
          layout: {
            backgroundColor: '#333333',
            textColor: '#D1D5DB'
          },
          grid: {
            vertLines: {
              color: '#525252',
            },
            horzLines: {
              color: '#525252',
            }
          },
          priceScale: {
            borderColor: '#525252'
          },
          timeScale: {
            borderColor: '#525252',
            timeVisible: true,
            secondsVisible: false
          }
        }
      }
    }
  },
  computed: {
    ...mapWritableState(useMainStore, [
      'theme',
    ]),
    displayCurves () {
      // Limit the number of displayed curves for performance
      if (this.equityCurves.length <= this.maxCurves) {
        return this.equityCurves
      }
      // Sample curves evenly
      const step = Math.ceil(this.equityCurves.length / this.maxCurves)
      return this.equityCurves.filter((_, index) => index % step === 0)
    }
  },
  watch: {
    equityCurves () {
      this.updateChart()
    },
    theme (newVal) {
      this.checkTheme(newVal)
    }
  },
  mounted () {
    this.initChart()
  },
  beforeUnmount () {
    if (chart) {
      chart.remove()
    }
    chart = null
    lineSeries = []
  },
  methods: {
    initChart () {
      this.settings.width = this.$refs.chart.clientWidth
      chart = createChart(this.$refs.chart, this.settings)

      if (helpers.currentTheme() === 'light') {
        chart.applyOptions(this.lightTheme.chart)
      } else {
        chart.applyOptions(this.darkTheme.chart)
      }

      this.updateChart()
    },
    updateChart () {
      if (!chart) return

      // Remove existing series
      lineSeries.forEach(series => {
        try {
          chart.removeSeries(series)
        } catch (e) {
          // Series may already be removed
        }
      })
      lineSeries = []

      // Add new series for each equity curve
      this.displayCurves.forEach((curveData, index) => {
        const color = colors[index % colors.length]
        const opacity = Math.max(0.3, 1 - (index / this.displayCurves.length) * 0.5)

        const series = chart.addLineSeries({
          lineWidth: 1,
          color: this.adjustColorOpacity(color, opacity),
          crosshairMarkerVisible: false,
          lastValueVisible: false,
          priceLineVisible: false
        })

        series.setData(curveData)
        lineSeries.push(series)
      })

      chart.timeScale().fitContent()
    },
    adjustColorOpacity (hexColor, opacity) {
      // Convert hex to rgba
      const r = parseInt(hexColor.slice(1, 3), 16)
      const g = parseInt(hexColor.slice(3, 5), 16)
      const b = parseInt(hexColor.slice(5, 7), 16)
      return `rgba(${r}, ${g}, ${b}, ${opacity})`
    },
    checkTheme (val) {
      if (!chart) return

      if (val === 'light') {
        chart.applyOptions(this.lightTheme.chart)
      } else {
        chart.applyOptions(this.darkTheme.chart)
      }
    }
  }
}
</script>

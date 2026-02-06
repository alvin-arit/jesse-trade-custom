<template>
  <div>
    <div v-if="hasChartData" ref="chart" class="rounded overflow-hidden border-2 border-gray-100 dark:border-gray-600" />
    <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded">
      <p>Loading chart data...</p>
    </div>
  </div>
</template>

<script>
import { createChart, CrosshairMode } from 'lightweight-charts'
import { useMainStore } from '@/stores/main'
import { mapWritableState } from 'pinia'

export default {
  name: 'BacktestChart',
  props: {
    candles: {
      type: Array,
      default: () => []
    },
    orders: {
      type: Array,
      default: () => []
    },
    lines: {
      type: Array,
      default: () => []
    }
  },
  data () {
    return {
      chart: null,
      candleSeries: null,
      lineSeries: [],
      markers: [],
      settings: {
        width: 800,
        height: 450,
        crosshair: {
          mode: CrosshairMode.Normal
        },
        timeScale: {
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
            vertLines: { color: '#f1f1f1', visible: false },
            horzLines: { color: '#f1f1f1', visible: false }
          },
          priceScale: { borderColor: 'rgba(197, 203, 206, 0.6)' },
          timeScale: { borderColor: 'rgba(197, 203, 206, 0.6)', timeVisible: true, secondsVisible: false }
        }
      },
      darkTheme: {
        chart: {
          layout: {
            backgroundColor: '#333333',
            textColor: '#D1D5DB'
          },
          grid: {
            vertLines: { color: '#525252', visible: false },
            horzLines: { color: '#525252', visible: false }
          },
          priceScale: { borderColor: '#525252' },
          timeScale: { borderColor: '#525252', timeVisible: true, secondsVisible: false }
        }
      }
    }
  },
  computed: {
    ...mapWritableState(useMainStore, ['theme']),
    hasChartData () {
      return this.candles.length > 0 && this.candles[0]?.candles?.length > 0
    },
    firstRouteCandles () {
      if (this.candles.length > 0 && this.candles[0].candles) {
        return this.candles[0].candles
      }
      return []
    },
    firstRouteOrders () {
      if (this.orders.length > 0 && this.orders[0].orders) {
        return this.orders[0].orders
      }
      return []
    }
  },
  watch: {
    theme (newVal) {
      this.applyTheme(newVal)
    },
    candles: {
      handler () {
        this.$nextTick(() => {
          this.initChart()
        })
      },
      deep: true
    }
  },
  mounted () {
    if (this.hasChartData) {
      this.$nextTick(() => {
        this.initChart()
      })
    }
  },
  beforeUnmount () {
    if (this.chart) {
      this.chart.remove()
      this.chart = null
    }
  },
  methods: {
    initChart () {
      if (!this.$refs.chart || !this.hasChartData) return

      // Remove existing chart if any
      if (this.chart) {
        this.chart.remove()
      }

      this.settings.width = this.$refs.chart.clientWidth
      this.chart = createChart(this.$refs.chart, this.settings)

      // Add candlestick series
      this.candleSeries = this.chart.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350'
      })
      this.candleSeries.setData(this.firstRouteCandles)

      // Add order markers
      this.addOrderMarkers()

      // Add indicator lines
      this.addIndicatorLines()

      // Fit content
      this.chart.timeScale().fitContent()

      // Apply theme
      this.applyTheme(this.theme)
    },
    addOrderMarkers () {
      if (!this.firstRouteOrders.length) return

      const markers = []

      this.firstRouteOrders.forEach(order => {
        // Entry marker
        if (order.executed_at) {
          const isLong = order.side === 'buy'
          markers.push({
            time: Math.floor(order.executed_at / 1000),
            position: isLong ? 'belowBar' : 'aboveBar',
            color: isLong ? '#26a69a' : '#ef5350',
            shape: isLong ? 'arrowUp' : 'arrowDown',
            text: `${order.side.toUpperCase()} @ ${order.price.toFixed(2)}`
          })
        }
      })

      // Sort markers by time
      markers.sort((a, b) => a.time - b.time)

      if (markers.length > 0) {
        this.candleSeries.setMarkers(markers)
      }
    },
    addIndicatorLines () {
      if (!this.lines || !this.lines.length) return

      const routeLines = this.lines[0]?.lines
      if (!routeLines || !Array.isArray(routeLines)) {
        console.log('[BacktestChart] No indicator lines or invalid format')
        return
      }

      routeLines.forEach((lineData, index) => {
        const colors = ['#2196F3', '#FF9800', '#9C27B0', '#4CAF50', '#E91E63']
        const color = colors[index % colors.length]

        const lineSeries = this.chart.addLineSeries({
          color: color,
          lineWidth: 1,
          title: lineData.name || `Line ${index + 1}`
        })

        if (lineData.data && Array.isArray(lineData.data)) {
          lineSeries.setData(lineData.data.map(point => ({
            time: point.time,
            value: point.value
          })))
        }

        this.lineSeries.push(lineSeries)
      })
    },
    applyTheme (theme) {
      if (!this.chart) return
      if (theme === 'light') {
        this.chart.applyOptions(this.lightTheme.chart)
      } else {
        this.chart.applyOptions(this.darkTheme.chart)
      }
    },
    navigateToTrade (trade) {
      if (!this.chart) return
      const padding = Math.max((trade.rawExitTime - trade.rawEntryTime) * 0.5, 3600)
      this.chart.timeScale().setVisibleRange({
        from: trade.rawEntryTime - padding,
        to: trade.rawExitTime + padding
      })
    },
    getChart () {
      return this.chart
    }
  }
}
</script>

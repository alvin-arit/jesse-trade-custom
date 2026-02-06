<template>
  <div>
    <div v-if="hasChartData" ref="chartWrapper" class="relative">
      <div ref="chart" class="rounded overflow-hidden border-2 border-gray-100 dark:border-gray-600" />
      <canvas
        ref="overlayCanvas"
        class="absolute pointer-events-none rounded"
        :style="canvasStyle"
      />
    </div>
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
  name: 'DetailedChart',
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
    },
    trades: {
      type: Array,
      default: () => []
    },
    shapes: {
      type: Array,
      default: () => []
    }
  },
  data () {
    return {
      chart: null,
      candleSeries: null,
      lineSeries: [],
      canvasWidth: 800,
      canvasHeight: 450,
      canvasTop: 0,
      canvasLeft: 0,
      animationFrameId: null,
      resizeObserver: null,
      settings: {
        width: 800,
        height: 500,
        crosshair: {
          mode: CrosshairMode.Normal
        },
        grid: {
          vertLines: { color: '#e1e1e1' },
          horzLines: { color: '#e1e1e1' }
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false
        }
      },
      lightTheme: {
        layout: {
          backgroundColor: '#ffffff',
          textColor: 'rgba(33, 56, 77, 1)'
        },
        grid: {
          vertLines: { color: '#e1e1e1' },
          horzLines: { color: '#e1e1e1' }
        },
        priceScale: { borderColor: 'rgba(197, 203, 206, 0.6)' },
        timeScale: { borderColor: 'rgba(197, 203, 206, 0.6)' }
      },
      darkTheme: {
        layout: {
          backgroundColor: '#333333',
          textColor: '#D1D5DB'
        },
        grid: {
          vertLines: { color: '#444444' },
          horzLines: { color: '#444444' }
        },
        priceScale: { borderColor: '#525252' },
        timeScale: { borderColor: '#525252' }
      },
      entryColor: '#2196F3',
      exitColor: '#FF9800',
      connectionColor: '#888888'
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
    validTrades () {
      if (!this.trades || !this.trades.length) return []
      return this.trades.filter(t =>
        t.opened_at && t.closed_at &&
        t.entry_price != null && t.exit_price != null &&
        Math.floor(t.opened_at / 1000) < Math.floor(t.closed_at / 1000)
      )
    },
    canvasStyle () {
      return {
        top: this.canvasTop + 'px',
        left: this.canvasLeft + 'px',
        width: this.canvasWidth + 'px',
        height: this.canvasHeight + 'px',
        zIndex: 10
      }
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
    },
    trades: {
      handler () {
        this.$nextTick(() => {
          if (this.candleSeries) {
            this.setDetailedMarkers()
            this.drawTradeAnnotations()
          }
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
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }
    if (this.chart) {
      this.chart.remove()
      this.chart = null
    }
  },
  methods: {
    initChart () {
      if (!this.$refs.chart || !this.hasChartData) return

      if (this.chart) {
        this.chart.remove()
      }

      this.lineSeries = []

      this.settings.width = this.$refs.chart.clientWidth
      this.chart = createChart(this.$refs.chart, this.settings)

      this.candleSeries = this.chart.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350'
      })
      this.candleSeries.setData(this.firstRouteCandles)

      // Subscribe to chart updates to redraw overlay
      this.chart.timeScale().subscribeVisibleTimeRangeChange(() => {
        if (this.chart && this.candleSeries) {
          this.scheduleDrawAnnotations()
        }
      })

      this.setDetailedMarkers()
      this.addIndicatorLines()

      this.chart.timeScale().fitContent()
      this.applyTheme(this.theme)

      // Initial draw of annotations after chart is ready
      this.$nextTick(() => {
        setTimeout(() => {
          this.updateCanvasDimensions()
          this.setupOverlayCanvas()
          this.drawTradeAnnotations()
        }, 100)
      })
    },
    updateCanvasDimensions () {
      if (!this.$refs.chart || !this.chart) return

      // Get the chart's internal canvas to find the exact drawing area
      const chartElement = this.$refs.chart
      const internalCanvas = chartElement.querySelector('canvas')

      if (internalCanvas) {
        // The internal canvas covers the drawing area
        const rect = internalCanvas.getBoundingClientRect()
        const wrapperRect = chartElement.getBoundingClientRect()

        this.canvasWidth = rect.width
        this.canvasHeight = rect.height
        this.canvasTop = rect.top - wrapperRect.top
        this.canvasLeft = rect.left - wrapperRect.left
      } else {
        // Fallback: estimate based on typical chart layout
        // Price scale is typically ~50px on right, time scale ~30px on bottom
        this.canvasWidth = this.settings.width - 50
        this.canvasHeight = this.settings.height - 30
        this.canvasTop = 0
        this.canvasLeft = 0
      }
    },
    setupOverlayCanvas () {
      const canvas = this.$refs.overlayCanvas
      if (!canvas) return

      const dpr = window.devicePixelRatio || 1
      canvas.width = this.canvasWidth * dpr
      canvas.height = this.canvasHeight * dpr

      const ctx = canvas.getContext('2d')
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    },
    scheduleDrawAnnotations () {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId)
      }
      this.animationFrameId = requestAnimationFrame(() => {
        this.drawTradeAnnotations()
      })
    },
    drawTradeAnnotations () {
      const canvas = this.$refs.overlayCanvas
      if (!canvas || !this.chart || !this.candleSeries) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Clear canvas
      ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight)

      const timeScale = this.chart.timeScale()
      if (!timeScale) return

      // Draw FVG shapes first (behind trade annotations)
      this.drawShapes(ctx, timeScale)

      if (!this.validTrades.length) return

      this.validTrades.forEach((trade) => {
        try {
          const entryTime = Math.floor(trade.opened_at / 1000)
          const exitTime = Math.floor(trade.closed_at / 1000)

          // Validate times
          if (!entryTime || !exitTime || isNaN(entryTime) || isNaN(exitTime)) return

          // Convert time to x coordinates
          const entryX = timeScale.timeToCoordinate(entryTime)
          const exitX = timeScale.timeToCoordinate(exitTime)

          // Skip if both are off-screen
          if (entryX === null && exitX === null) return

          // Convert price to y coordinates
          const entryY = this.candleSeries.priceToCoordinate(trade.entry_price)
          const exitY = this.candleSeries.priceToCoordinate(trade.exit_price)

          if (entryY === null || exitY === null) return

          // Calculate horizontal line width (in pixels)
          const tradeDurationPixels = (exitX !== null && entryX !== null)
            ? Math.abs(exitX - entryX)
            : 100
          const lineHalfWidth = Math.max(Math.floor(tradeDurationPixels * 0.04), 10)

          // Draw connection line (dotted) - from entry to exit
          if (entryX !== null && exitX !== null) {
            ctx.save()
            ctx.beginPath()
            ctx.strokeStyle = this.connectionColor
            ctx.lineWidth = 1.5
            ctx.setLineDash([5, 5])
            ctx.moveTo(entryX, entryY)
            ctx.lineTo(exitX, exitY)
            ctx.stroke()
            ctx.restore()
          }

          // Draw entry horizontal line (blue)
          if (entryX !== null) {
            ctx.save()
            ctx.beginPath()
            ctx.strokeStyle = this.entryColor
            ctx.lineWidth = 2
            ctx.setLineDash([])
            ctx.moveTo(entryX - lineHalfWidth, entryY)
            ctx.lineTo(entryX + lineHalfWidth, entryY)
            ctx.stroke()
            ctx.restore()
          }

          // Draw exit horizontal line (orange)
          if (exitX !== null) {
            ctx.save()
            ctx.beginPath()
            ctx.strokeStyle = this.exitColor
            ctx.lineWidth = 2
            ctx.setLineDash([])
            ctx.moveTo(exitX - lineHalfWidth, exitY)
            ctx.lineTo(exitX + lineHalfWidth, exitY)
            ctx.stroke()
            ctx.restore()
          }
        } catch (e) {
          // Skip this trade if there's an error
        }
      })
    },
    drawShapes (ctx, timeScale) {
      if (!this.shapes || !this.shapes.length) return
      if (!this.candleSeries) return

      // Get shapes from the first route (matching how we handle lines)
      const routeShapes = this.shapes[0]?.shapes
      if (!routeShapes || !Array.isArray(routeShapes)) return

      routeShapes.forEach((shape) => {
        try {
          if (shape.type !== 'rectangle') return

          const startX = timeScale.timeToCoordinate(shape.start_time)
          const endX = timeScale.timeToCoordinate(shape.end_time)

          // Skip if both are off-screen
          if (startX === null && endX === null) return

          const topY = this.candleSeries.priceToCoordinate(shape.top)
          const bottomY = this.candleSeries.priceToCoordinate(shape.bottom)

          if (topY === null || bottomY === null) return

          // Calculate rectangle bounds
          const x1 = startX !== null ? startX : 0
          const x2 = endX !== null ? endX : this.canvasWidth
          const y1 = Math.min(topY, bottomY)
          const y2 = Math.max(topY, bottomY)

          const width = Math.abs(x2 - x1)
          const height = Math.abs(y2 - y1)

          // Draw filled rectangle
          ctx.save()
          ctx.fillStyle = shape.color || 'rgba(100, 100, 100, 0.2)'
          ctx.fillRect(x1, y1, width, height)

          // Draw border
          if (shape.border_color) {
            ctx.strokeStyle = shape.border_color
            ctx.lineWidth = 1
            ctx.setLineDash([])
            ctx.strokeRect(x1, y1, width, height)
          }

          ctx.restore()
        } catch (e) {
          // Skip this shape if there's an error
        }
      })
    },
    generateDetailedMarkers () {
      const markers = []

      if (!this.trades || !this.trades.length) {
        return markers
      }

      this.trades.forEach((trade, i) => {
        const isLong = trade.type === 'long'
        const tradeNum = i + 1

        // Entry marker - only show trade number
        if (trade.opened_at && !isNaN(trade.opened_at)) {
          const entryTime = Math.floor(trade.opened_at / 1000)
          if (entryTime && !isNaN(entryTime)) {
            markers.push({
              time: entryTime,
              position: isLong ? 'belowBar' : 'aboveBar',
              color: this.entryColor,
              shape: isLong ? 'arrowUp' : 'arrowDown',
              text: `#${tradeNum}`
            })
          }
        }

        // Exit marker - only show trade number
        if (trade.closed_at && !isNaN(trade.closed_at)) {
          const exitTime = Math.floor(trade.closed_at / 1000)
          if (exitTime && !isNaN(exitTime)) {
            markers.push({
              time: exitTime,
              position: isLong ? 'aboveBar' : 'belowBar',
              color: this.exitColor,
              shape: 'circle',
              text: `#${tradeNum}`
            })
          }
        }
      })

      return markers.sort((a, b) => a.time - b.time)
    },
    setDetailedMarkers () {
      if (!this.candleSeries) return

      try {
        const markers = this.generateDetailedMarkers()
        this.candleSeries.setMarkers(markers)
      } catch (e) {
        console.warn('Failed to set markers:', e)
      }
    },
    addIndicatorLines () {
      if (!this.lines || !this.lines.length) return

      const routeLines = this.lines[0]?.lines
      if (!routeLines || !Array.isArray(routeLines)) {
        return
      }

      routeLines.forEach((lineData, index) => {
        const colors = ['#9C27B0', '#4CAF50', '#E91E63', '#00BCD4', '#FFEB3B']
        const color = colors[index % colors.length]

        const lineSeries = this.chart.addLineSeries({
          color: lineData.color || color,
          lineWidth: 1,
          title: lineData.name || `Line ${index + 1}`,
          crosshairMarkerVisible: false,
          lastValueVisible: false,
          priceLineVisible: false,
          // Don't include this series in price scale auto-scaling
          autoscaleInfoProvider: () => null
        })

        if (lineData.data && Array.isArray(lineData.data)) {
          // Filter out invalid data points to prevent crosshair errors
          const validData = lineData.data
            .filter(point => point && point.time != null && point.value != null && !isNaN(point.value))
            .map(point => ({
              time: point.time,
              value: point.value
            }))
          if (validData.length > 0) {
            lineSeries.setData(validData)
          }
        }

        this.lineSeries.push(lineSeries)
      })
    },
    applyTheme (theme) {
      if (!this.chart) return
      try {
        if (theme === 'light') {
          this.chart.applyOptions(this.lightTheme)
        } else {
          this.chart.applyOptions(this.darkTheme)
        }
      } catch (e) {
        console.warn('Failed to apply theme:', e)
      }
    },
    navigateToTrade (trade) {
      if (!this.chart) return
      const padding = Math.max((trade.rawExitTime - trade.rawEntryTime) * 0.5, 3600)
      this.chart.timeScale().setVisibleRange({
        from: trade.rawEntryTime - padding,
        to: trade.rawExitTime + padding
      })
      // Redraw annotations after navigation
      this.$nextTick(() => {
        this.scheduleDrawAnnotations()
      })
    }
  }
}
</script>

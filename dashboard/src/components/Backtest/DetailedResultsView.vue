<template>
  <div class="space-y-8">
    <div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Price Chart</h3>
      <DetailedChart
        ref="chart"
        :candles="candles"
        :orders="orders"
        :lines="lines"
        :trades="trades"
        :shapes="shapes"
      />
    </div>

    <div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Trade List</h3>
      <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <TradeListTable
          :trades="trades"
          @trade-click="handleTradeClick"
        />
      </div>
    </div>
  </div>
</template>

<script>
import DetailedChart from './DetailedChart.vue'
import TradeListTable from './TradeListTable.vue'

export default {
  name: 'DetailedResultsView',
  components: {
    DetailedChart,
    TradeListTable
  },
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
  methods: {
    handleTradeClick (trade) {
      if (this.$refs.chart) {
        this.$refs.chart.navigateToTrade(trade)
      }
    }
  }
}
</script>

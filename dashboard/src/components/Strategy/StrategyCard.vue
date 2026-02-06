<template>
  <div class="bg-white dark:bg-backdrop-dark shadow rounded-lg overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
            {{ strategy.name || strategy.title }}
          </h3>
          <p v-if="strategy.description" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ strategy.description }}
          </p>
        </div>
        <div v-if="strategy.author" class="text-sm text-gray-500 dark:text-gray-400">
          by {{ strategy.author }}
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="px-6 py-4">
      <!-- Tags -->
      <div v-if="strategy.tags && strategy.tags.length" class="mb-4">
        <div class="flex flex-wrap gap-2">
          <span v-for="tag in strategy.tags" :key="tag"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300">
            {{ tag }}
          </span>
        </div>
      </div>

      <!-- Metrics -->
      <div v-if="metrics" class="grid grid-cols-2 gap-4 mb-4">
        <div v-if="metrics.sharpe_ratio !== undefined">
          <span class="text-xs text-gray-500 dark:text-gray-400">Sharpe Ratio</span>
          <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
            {{ formatNumber(metrics.sharpe_ratio) }}
          </p>
        </div>
        <div v-if="metrics.win_rate !== undefined">
          <span class="text-xs text-gray-500 dark:text-gray-400">Win Rate</span>
          <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
            {{ formatPercent(metrics.win_rate) }}
          </p>
        </div>
        <div v-if="metrics.profit_factor !== undefined">
          <span class="text-xs text-gray-500 dark:text-gray-400">Profit Factor</span>
          <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
            {{ formatNumber(metrics.profit_factor) }}
          </p>
        </div>
        <div v-if="metrics.max_drawdown !== undefined">
          <span class="text-xs text-gray-500 dark:text-gray-400">Max Drawdown</span>
          <p class="text-sm font-medium text-red-600 dark:text-red-400">
            {{ formatPercent(metrics.max_drawdown) }}
          </p>
        </div>
      </div>

      <!-- Trading Pairs -->
      <div v-if="strategy.pairs && strategy.pairs.length" class="mb-4">
        <h4 class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">Trading Pairs</h4>
        <div class="flex flex-wrap gap-2">
          <span v-for="pair in strategy.pairs" :key="pair"
                class="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            {{ pair }}
          </span>
        </div>
      </div>

      <!-- Exchanges -->
      <div v-if="strategy.exchanges && strategy.exchanges.length" class="mb-4">
        <h4 class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">Exchanges</h4>
        <div class="flex flex-wrap gap-2">
          <span v-for="exchange in strategy.exchanges" :key="exchange"
                class="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            {{ exchange }}
          </span>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <div class="flex space-x-3">
          <button v-if="showViewCode"
                  class="btn-secondary text-sm px-3 py-1.5"
                  @click="$emit('view-code')">
            View Code
          </button>
        </div>
        <div class="flex space-x-3">
          <button v-if="showImport"
                  class="btn-primary text-sm px-3 py-1.5"
                  @click="$emit('import')">
            Import
          </button>
          <button v-if="showEdit"
                  class="btn-primary text-sm px-3 py-1.5"
                  @click="$emit('edit')">
            Edit
          </button>
          <button v-if="showDelete"
                  class="btn-cancel text-sm px-3 py-1.5"
                  @click="$emit('delete')">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'

export default {
  name: 'StrategyCard',
  props: {
    strategy: {
      type: Object,
      required: true
    },
    metrics: {
      type: Object,
      default: null
    },
    showViewCode: {
      type: Boolean,
      default: false
    },
    showImport: {
      type: Boolean,
      default: false
    },
    showEdit: {
      type: Boolean,
      default: false
    },
    showDelete: {
      type: Boolean,
      default: false
    }
  },
  emits: ['view-code', 'import', 'edit', 'delete'],
  methods: {
    formatNumber (value) {
      if (value === null || value === undefined) return '-'
      return _.round(value, 2)
    },
    formatPercent (value) {
      if (value === null || value === undefined) return '-'
      return `${_.round(value * 100, 2)}%`
    }
  }
}
</script>

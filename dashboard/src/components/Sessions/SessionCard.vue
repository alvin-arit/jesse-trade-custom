<template>
  <div class="bg-white dark:bg-backdrop-dark shadow rounded-lg overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
            {{ session.strategy_name || 'Session Details' }}
          </h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ formatDate(session.created_at) }}
          </p>
        </div>
        <div class="flex items-center space-x-2">
          <span :class="statusClass" class="px-2 py-1 text-xs font-medium rounded-full">
            {{ statusText }}
          </span>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="px-6 py-4">
      <!-- Route Info -->
      <div v-if="session.exchange || session.symbol" class="mb-4">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Route</h4>
        <div class="flex items-center space-x-4 text-sm text-gray-900 dark:text-gray-100">
          <span v-if="session.exchange" class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            {{ session.exchange }}
          </span>
          <span v-if="session.symbol" class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            {{ session.symbol }}
          </span>
          <span v-if="session.timeframe" class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            {{ session.timeframe }}
          </span>
        </div>
      </div>

      <!-- Duration -->
      <div v-if="session.start_date || session.finish_date" class="mb-4">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Duration</h4>
        <p class="text-sm text-gray-900 dark:text-gray-100">
          {{ session.start_date }} - {{ session.finish_date }}
        </p>
      </div>

      <!-- Metrics -->
      <div v-if="hasMetrics" class="mb-4">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Performance</h4>
        <div class="grid grid-cols-2 gap-4">
          <div v-if="session.net_profit !== undefined">
            <span class="text-xs text-gray-500 dark:text-gray-400">Net Profit</span>
            <p :class="profitClass" class="text-sm font-medium">
              {{ formatProfit(session.net_profit) }}
            </p>
          </div>
          <div v-if="session.total_trades !== undefined">
            <span class="text-xs text-gray-500 dark:text-gray-400">Total Trades</span>
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
              {{ session.total_trades }}
            </p>
          </div>
          <div v-if="session.win_rate !== undefined">
            <span class="text-xs text-gray-500 dark:text-gray-400">Win Rate</span>
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
              {{ formatPercent(session.win_rate) }}
            </p>
          </div>
          <div v-if="session.max_drawdown !== undefined">
            <span class="text-xs text-gray-500 dark:text-gray-400">Max Drawdown</span>
            <p class="text-sm font-medium text-red-600 dark:text-red-400">
              {{ formatPercent(session.max_drawdown) }}
            </p>
          </div>
          <div v-if="session.sharpe_ratio !== undefined">
            <span class="text-xs text-gray-500 dark:text-gray-400">Sharpe Ratio</span>
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
              {{ formatNumber(session.sharpe_ratio) }}
            </p>
          </div>
          <div v-if="session.calmar_ratio !== undefined">
            <span class="text-xs text-gray-500 dark:text-gray-400">Calmar Ratio</span>
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
              {{ formatNumber(session.calmar_ratio) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div v-if="showNotes" class="mb-4">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</h4>
        <textarea
          v-model="notes"
          rows="3"
          class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Add notes about this session..."
          @blur="saveNotes"
        />
      </div>

      <!-- Error -->
      <div v-if="session.error" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
        <h4 class="text-sm font-medium text-red-800 dark:text-red-400 mb-1">Error</h4>
        <p class="text-sm text-red-700 dark:text-red-300">{{ session.error }}</p>
      </div>
    </div>

    <!-- Actions -->
    <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <div class="flex space-x-3">
          <button v-if="showViewChart"
                  class="btn-secondary text-sm px-3 py-1.5"
                  @click="$emit('view-chart')">
            View Chart
          </button>
          <button v-if="showViewCode"
                  class="btn-secondary text-sm px-3 py-1.5"
                  @click="$emit('view-code')">
            View Strategy
          </button>
          <button v-if="showViewLogs"
                  class="btn-secondary text-sm px-3 py-1.5"
                  @click="$emit('view-logs')">
            View Logs
          </button>
        </div>
        <div class="flex space-x-3">
          <button v-if="showRerun"
                  class="btn-success text-sm px-3 py-1.5"
                  @click="$emit('rerun')">
            Rerun
          </button>
          <button class="btn-cancel text-sm px-3 py-1.5"
                  @click="$emit('remove')">
            Remove
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import helpers from '@/helpers'
import _ from 'lodash'

export default {
  name: 'SessionCard',
  props: {
    session: {
      type: Object,
      required: true
    },
    showNotes: {
      type: Boolean,
      default: true
    },
    showViewChart: {
      type: Boolean,
      default: false
    },
    showViewCode: {
      type: Boolean,
      default: false
    },
    showViewLogs: {
      type: Boolean,
      default: false
    },
    showRerun: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update-notes', 'view-chart', 'view-code', 'view-logs', 'rerun', 'remove'],
  data () {
    return {
      notes: this.session.notes || ''
    }
  },
  computed: {
    statusClass () {
      if (this.session.completed) {
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
      }
      if (this.session.error) {
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
      }
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
    },
    statusText () {
      if (this.session.completed) return 'Completed'
      if (this.session.error) return 'Failed'
      return 'In Progress'
    },
    hasMetrics () {
      return this.session.net_profit !== undefined ||
             this.session.total_trades !== undefined ||
             this.session.win_rate !== undefined ||
             this.session.max_drawdown !== undefined
    },
    profitClass () {
      if (this.session.net_profit > 0) return 'text-green-600 dark:text-green-400'
      if (this.session.net_profit < 0) return 'text-red-600 dark:text-red-400'
      return 'text-gray-900 dark:text-gray-100'
    }
  },
  watch: {
    session: {
      handler (newVal) {
        this.notes = newVal.notes || ''
      },
      deep: true
    }
  },
  methods: {
    formatDate (timestamp) {
      if (!timestamp) return '-'
      return helpers.timestampToTime(timestamp)
    },
    formatProfit (value) {
      if (value === null || value === undefined) return '-'
      const sign = value >= 0 ? '+' : ''
      return `${sign}${_.round(value, 2)}%`
    },
    formatPercent (value) {
      if (value === null || value === undefined) return '-'
      return `${_.round(value * 100, 2)}%`
    },
    formatNumber (value) {
      if (value === null || value === undefined) return '-'
      return _.round(value, 2)
    },
    saveNotes () {
      if (this.notes !== this.session.notes) {
        this.$emit('update-notes', this.notes)
      }
    }
  }
}
</script>

<template>
  <div class="bg-white dark:bg-backdrop-dark shadow rounded-lg p-4">
    <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Actions</h3>

    <div class="space-y-3">
      <button class="flex items-center justify-center w-full btn-primary"
              @click="$emit('import')">
        <DownloadIcon class="h-5 w-5 mr-2" />
        Import More Candles
      </button>

      <button class="flex items-center justify-center w-full btn-secondary"
              @click="$emit('clear-cache')">
        <TrashIcon class="h-5 w-5 mr-2" />
        Clear Cache
      </button>

      <button class="flex items-center justify-center w-full btn-secondary"
              @click="$emit('refresh')">
        <RefreshIcon class="h-5 w-5 mr-2" />
        Refresh List
      </button>
    </div>

    <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
      <h4 class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">Summary</h4>
      <dl class="space-y-1">
        <div class="flex justify-between">
          <dt class="text-sm text-gray-500 dark:text-gray-400">Total Pairs</dt>
          <dd class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ totalPairs }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-sm text-gray-500 dark:text-gray-400">Total Candles</dt>
          <dd class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ formatCount(totalCandles) }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-sm text-gray-500 dark:text-gray-400">Exchanges</dt>
          <dd class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ uniqueExchanges }}</dd>
        </div>
      </dl>
    </div>
  </div>
</template>

<script>
import { DownloadIcon, TrashIcon, RefreshIcon } from '@heroicons/vue/outline'

export default {
  name: 'CandleActions',
  components: {
    DownloadIcon,
    TrashIcon,
    RefreshIcon
  },
  props: {
    candles: {
      type: Array,
      required: true
    }
  },
  emits: ['import', 'clear-cache', 'refresh'],
  computed: {
    totalPairs () {
      return this.candles.length
    },
    totalCandles () {
      return this.candles.reduce((sum, c) => sum + (c.count || 0), 0)
    },
    uniqueExchanges () {
      return [...new Set(this.candles.map(c => c.exchange))].length
    }
  },
  methods: {
    formatCount (count) {
      if (!count) return '0'
      return count.toLocaleString()
    }
  }
}
</script>

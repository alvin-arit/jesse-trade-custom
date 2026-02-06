<template>
  <div class="overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">Existing Candles</h3>
      <div class="flex space-x-2">
        <button class="btn-secondary text-sm"
                @click="$emit('clear-cache')">
          Clear Cache
        </button>
        <button class="btn-secondary text-sm"
                @click="$emit('refresh')">
          <RefreshIcon class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <Spinner />
    </div>

    <!-- Empty state -->
    <div v-else-if="candles.length === 0" class="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
      <DatabaseIcon class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No candles stored</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Import candles from the form above to see them here.
      </p>
    </div>

    <!-- Candles table -->
    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Exchange
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Symbol
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Start Date
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              End Date
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Count
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-backdrop-dark divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="candle in candles" :key="`${candle.exchange}-${candle.symbol}`"
              class="hover:bg-gray-50 dark:hover:bg-gray-800">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
              {{ candle.exchange }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
              {{ candle.symbol }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              {{ formatDate(candle.start_date) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              {{ formatDate(candle.finish_date) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              {{ formatCount(candle.count) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                      @click="$emit('delete', candle)">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { RefreshIcon, DatabaseIcon } from '@heroicons/vue/outline'
import helpers from '@/helpers'

export default {
  name: 'ExistingCandlesTable',
  components: {
    RefreshIcon,
    DatabaseIcon
  },
  props: {
    candles: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['delete', 'refresh', 'clear-cache'],
  methods: {
    formatDate (timestamp) {
      if (!timestamp) return '-'
      return helpers.timestampToDate(timestamp)
    },
    formatCount (count) {
      if (!count) return '-'
      return count.toLocaleString()
    }
  }
}
</script>

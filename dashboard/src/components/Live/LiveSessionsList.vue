<template>
  <div class="overflow-hidden">
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <Spinner />
    </div>

    <!-- Empty state -->
    <div v-else-if="sessions.length === 0" class="text-center py-12">
      <CurrencyDollarIcon class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No live sessions</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {{ emptyMessage || 'No live trading sessions found.' }}
      </p>
    </div>

    <!-- Sessions table -->
    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Date
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Strategy
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Exchange
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Symbol
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Mode
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              PNL
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-backdrop-dark divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="session in sessions" :key="session.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
              @click="$emit('select', session)">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
              {{ formatDate(session.started_at) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
              {{ session.strategy_name || '-' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              {{ session.exchange || '-' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              {{ session.symbol || '-' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <span :class="getModeClass(session.paper_mode)" class="px-2 py-1 text-xs rounded-full">
                {{ session.paper_mode ? 'Paper' : 'Live' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <span :class="getStatusClass(session)" class="px-2 py-1 text-xs rounded-full">
                {{ getStatusText(session) }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm" :class="getPnlClass(session.pnl)">
              {{ formatPnl(session.pnl) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-3"
                      @click.stop="$emit('view-logs', session)">
                Logs
              </button>
              <button class="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                      @click.stop="$emit('view-orders', session)">
                Orders
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { CurrencyDollarIcon } from '@heroicons/vue/outline'
import helpers from '@/helpers'
import _ from 'lodash'

export default {
  name: 'LiveSessionsList',
  components: {
    CurrencyDollarIcon
  },
  props: {
    sessions: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    },
    emptyMessage: {
      type: String,
      default: ''
    }
  },
  emits: ['select', 'view-logs', 'view-orders'],
  methods: {
    formatDate (timestamp) {
      if (!timestamp) return '-'
      return helpers.timestampToTime(timestamp)
    },
    getModeClass (paperMode) {
      if (paperMode) {
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
      }
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
    },
    getStatusClass (session) {
      if (session.running) {
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
      }
      if (session.error) {
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
      }
      return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400'
    },
    getStatusText (session) {
      if (session.running) return 'Running'
      if (session.error) return 'Error'
      return 'Stopped'
    },
    getPnlClass (pnl) {
      if (pnl > 0) return 'text-green-600 dark:text-green-400'
      if (pnl < 0) return 'text-red-600 dark:text-red-400'
      return 'text-gray-900 dark:text-gray-100'
    },
    formatPnl (pnl) {
      if (pnl === null || pnl === undefined) return '-'
      const sign = pnl >= 0 ? '+' : ''
      return `${sign}${_.round(pnl, 2)}%`
    }
  }
}
</script>

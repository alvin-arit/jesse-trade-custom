<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Live Trading History</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View your past live and paper trading sessions
          </p>
        </div>
        <div class="flex space-x-3">
          <button class="btn-secondary" @click="fetchSessions">
            <RefreshIcon class="h-4 w-4 mr-1" />
            Refresh
          </button>
          <router-link to="/live/1" class="btn-primary">
            New Session
          </router-link>
        </div>
      </div>
    </div>

    <!-- Session Logs Slide Over -->
    <SlideOver
      name="showLogs"
      :object="slideOver"
      :title="`Logs - ${selectedSession?.strategy_name || 'Session'}`"
      width="max-w-4xl"
    >
      <div v-if="loadingLogs" class="flex justify-center items-center py-12">
        <Spinner />
      </div>
      <div v-else-if="selectedSessionLogs" class="p-4">
        <Logs :logs="selectedSessionLogs" />
      </div>
      <div v-else class="p-4 text-center text-gray-500 dark:text-gray-400">
        No logs available for this session.
      </div>
    </SlideOver>

    <!-- Session Orders Slide Over -->
    <SlideOver
      name="showOrders"
      :object="slideOver"
      :title="`Orders - ${selectedSession?.strategy_name || 'Session'}`"
      width="max-w-4xl"
    >
      <div v-if="loadingOrders" class="flex justify-center items-center py-12">
        <Spinner />
      </div>
      <div v-else-if="selectedSessionOrders.length > 0" class="p-4">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Symbol</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Side</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Qty</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Price</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Created</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-backdrop-dark divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="order in selectedSessionOrders" :key="order.id">
                <td class="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{{ order.symbol }}</td>
                <td class="px-4 py-2 text-sm" :class="getSideClass(order.side)">{{ order.side }}</td>
                <td class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{{ order.type }}</td>
                <td class="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{{ order.qty }}</td>
                <td class="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{{ formatPrice(order.price) }}</td>
                <td class="px-4 py-2 text-sm">
                  <span :class="getStatusClass(order.status)" class="px-2 py-1 text-xs rounded-full">
                    {{ order.status }}
                  </span>
                </td>
                <td class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{{ formatDate(order.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else class="p-4 text-center text-gray-500 dark:text-gray-400">
        No orders for this session.
      </div>
    </SlideOver>

    <!-- Sessions List -->
    <LiveSessionsList
      :sessions="sessions"
      :loading="loadingSessions"
      empty-message="No live trading sessions found. Start a live or paper trading session to see it here."
      @select="selectSession"
      @view-logs="viewLogs"
      @view-orders="viewOrders"
    />
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useLiveStore } from '@/stores/live'
import LiveSessionsList from '@/components/Live/LiveSessionsList'
import SlideOver from '@/components/Functional/SlideOver'
import Logs from '@/components/Logs'
import { RefreshIcon } from '@heroicons/vue/outline'
import helpers from '@/helpers'

export default {
  name: 'LiveHistory',
  components: {
    LiveSessionsList,
    SlideOver,
    Logs,
    RefreshIcon
  },
  data () {
    return {
      slideOver: {
        showLogs: false,
        showOrders: false
      },
      selectedSession: null,
      loadingLogs: false,
      loadingOrders: false
    }
  },
  computed: {
    ...mapState(useLiveStore, ['sessions', 'loadingSessions', 'selectedSessionLogs', 'selectedSessionOrders'])
  },
  created () {
    this.fetchSessions()
  },
  methods: {
    ...mapActions(useLiveStore, ['fetchSessions', 'fetchSessionLogs', 'fetchSessionOrders', 'clearSelectedSession']),
    selectSession (session) {
      this.selectedSession = session
    },
    async viewLogs (session) {
      this.selectedSession = session
      this.loadingLogs = true
      this.slideOver.showLogs = true
      await this.fetchSessionLogs(session.id)
      this.loadingLogs = false
    },
    async viewOrders (session) {
      this.selectedSession = session
      this.loadingOrders = true
      this.slideOver.showOrders = true
      await this.fetchSessionOrders(session.id)
      this.loadingOrders = false
    },
    formatDate (timestamp) {
      if (!timestamp) return '-'
      return helpers.timestampToTime(timestamp)
    },
    formatPrice (price) {
      if (price === null || price === undefined) return '-'
      return helpers.roundPrice(price)
    },
    getSideClass (side) {
      if (side === 'buy') return 'text-green-600 dark:text-green-400'
      if (side === 'sell') return 'text-red-600 dark:text-red-400'
      return 'text-gray-900 dark:text-gray-100'
    },
    getStatusClass (status) {
      const statusUpper = (status || '').toUpperCase()
      if (statusUpper === 'FILLED' || statusUpper === 'EXECUTED') {
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
      }
      if (statusUpper === 'CANCELED' || statusUpper === 'CANCELLED') {
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400'
      }
      if (statusUpper === 'ACTIVE' || statusUpper === 'OPEN') {
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
      }
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
    }
  }
}
</script>

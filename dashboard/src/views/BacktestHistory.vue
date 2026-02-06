<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Backtest History</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View and manage your past backtest sessions
          </p>
        </div>
        <router-link to="/backtest/1" class="btn-primary">
          New Backtest
        </router-link>
      </div>
    </div>

    <!-- Filters -->
    <SessionFilters
      :filters="filters"
      @update:filters="filters = $event"
      @refresh="fetchSessions"
      @purge="confirmPurge"
    />

    <!-- Session Detail Slide Over -->
    <SlideOver
      name="showDetail"
      :object="slideOver"
      :title="selectedSession ? selectedSession.strategy_name || 'Session Details' : 'Session Details'"
      width="max-w-2xl"
    >
      <SessionCard
        v-if="selectedSession"
        :session="selectedSession"
        :show-view-chart="true"
        :show-view-code="true"
        :show-view-logs="selectedSession.debug_mode"
        :show-rerun="true"
        @update-notes="updateNotes"
        @view-chart="viewChart"
        @view-code="viewCode"
        @view-logs="viewLogs"
        @rerun="rerunSession"
        @remove="removeSelectedSession"
      />
    </SlideOver>

    <!-- Chart Modal -->
    <SlideOver
      name="showChart"
      :object="slideOver"
      title="Equity Curve"
      width="max-w-4xl"
    >
      <div v-if="chartData" class="p-4">
        <EquityCurve :equity-curve="chartData" />
      </div>
      <div v-else class="flex justify-center items-center py-12">
        <Spinner />
      </div>
    </SlideOver>

    <!-- Code Modal -->
    <SlideOver
      name="showCode"
      :object="slideOver"
      title="Strategy Code"
      width="max-w-4xl"
    >
      <div v-if="strategyCode" class="p-4">
        <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm"><code>{{ strategyCode }}</code></pre>
      </div>
      <div v-else class="flex justify-center items-center py-12">
        <Spinner />
      </div>
    </SlideOver>

    <!-- Logs Modal -->
    <SlideOver
      name="showLogs"
      :object="slideOver"
      title="Session Logs"
      width="max-w-4xl"
    >
      <div v-if="sessionLogs" class="p-4">
        <Logs :logs="sessionLogs" />
      </div>
      <div v-else class="flex justify-center items-center py-12">
        <Spinner />
      </div>
    </SlideOver>

    <!-- Confirm Purge Modal -->
    <SimpleConfirmModal
      :show="showPurgeConfirm"
      title="Purge All Sessions"
      message="Are you sure you want to delete all backtest sessions? This action cannot be undone."
      confirm-text="Purge All"
      @confirm="purgeSessions"
      @cancel="showPurgeConfirm = false"
    />

    <!-- Sessions List -->
    <SessionsList
      :sessions="filteredSessions"
      :columns="columns"
      :loading="loading"
      :show-rerun="true"
      empty-message="No backtest sessions found. Run a backtest to see it here."
      @select="selectSession"
      @view="viewSession"
      @rerun="rerunFromList"
      @remove="removeSession"
    />
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useSessionsStore } from '@/stores/sessions'
import { useBacktestStore } from '@/stores/backtest'
import SessionsList from '@/components/Sessions/SessionsList'
import SessionCard from '@/components/Sessions/SessionCard'
import SessionFilters from '@/components/Sessions/SessionFilters'
import SlideOver from '@/components/Functional/SlideOver'
import SimpleConfirmModal from '@/components/Modals/SimpleConfirmModal'
import Logs from '@/components/Logs'

export default {
  name: 'BacktestHistory',
  components: {
    SessionsList,
    SessionCard,
    SessionFilters,
    SlideOver,
    SimpleConfirmModal,
    Logs
  },
  data () {
    return {
      columns: [
        { key: 'created_at', label: 'Date' },
        { key: 'strategy_name', label: 'Strategy' },
        { key: 'exchange', label: 'Exchange' },
        { key: 'symbol', label: 'Symbol' },
        { key: 'timeframe', label: 'Timeframe' },
        { key: 'net_profit', label: 'Net Profit' },
        { key: 'status', label: 'Status' }
      ],
      slideOver: {
        showDetail: false,
        showChart: false,
        showCode: false,
        showLogs: false
      },
      showPurgeConfirm: false,
      chartData: null,
      strategyCode: null,
      sessionLogs: ''
    }
  },
  computed: {
    ...mapState(useSessionsStore, ['backtestSessions', 'loading', 'filters', 'selectedSession']),
    filteredSessions () {
      const store = useSessionsStore()
      return store.filteredBacktestSessions
    }
  },
  created () {
    this.fetchSessions()
  },
  methods: {
    ...mapActions(useSessionsStore, [
      'fetchBacktestSessions',
      'fetchBacktestSession',
      'removeBacktestSession',
      'updateBacktestSessionNotes',
      'fetchBacktestChartData',
      'fetchBacktestStrategyCode',
      'fetchBacktestLogs',
      'purgeBacktestSessions',
      'clearSelectedSession'
    ]),
    async fetchSessions () {
      await this.fetchBacktestSessions()
    },
    async selectSession (session) {
      await this.fetchBacktestSession(session.id)
      this.slideOver.showDetail = true
    },
    async viewSession (session) {
      await this.fetchBacktestSession(session.id)
      this.slideOver.showDetail = true
    },
    async updateNotes (notes) {
      if (this.selectedSession) {
        await this.updateBacktestSessionNotes(this.selectedSession.id, notes)
      }
    },
    async viewChart () {
      this.chartData = null
      this.slideOver.showChart = true
      if (this.selectedSession) {
        const data = await this.fetchBacktestChartData(this.selectedSession.id)
        if (data && data.equity_curve) {
          this.chartData = data.equity_curve.map(item => ({
            value: item.balance,
            time: item.timestamp
          }))
        }
      }
    },
    async viewCode () {
      this.strategyCode = null
      this.slideOver.showCode = true
      if (this.selectedSession) {
        this.strategyCode = await this.fetchBacktestStrategyCode(this.selectedSession.id)
      }
    },
    async viewLogs () {
      this.sessionLogs = ''
      this.slideOver.showLogs = true
      if (this.selectedSession) {
        this.sessionLogs = await this.fetchBacktestLogs(this.selectedSession.id)
      }
    },
    async rerunSession () {
      if (this.selectedSession) {
        const backtest = useBacktestStore()
        // Create a new tab with the session's configuration
        const tab = {
          form: {
            start_date: this.selectedSession.start_date,
            finish_date: this.selectedSession.finish_date,
            debug_mode: this.selectedSession.debug_mode || false,
            export_chart: this.selectedSession.export_chart || false,
            export_tradingview: this.selectedSession.export_tradingview || false,
            export_full_reports: this.selectedSession.export_full_reports || false,
            export_csv: this.selectedSession.export_csv || false,
            export_json: this.selectedSession.export_json || false,
            routes: this.selectedSession.routes || [],
            extra_routes: this.selectedSession.extra_routes || []
          }
        }
        // Navigate to backtest and start
        this.$router.push('/backtest/1')
        // Update the form in the store
        Object.assign(backtest.tabs[1].form, tab.form)
      }
    },
    async rerunFromList (session) {
      await this.fetchBacktestSession(session.id)
      await this.rerunSession()
    },
    async removeSession (session) {
      if (confirm('Are you sure you want to remove this session?')) {
        await this.removeBacktestSession(session.id)
      }
    },
    async removeSelectedSession () {
      if (this.selectedSession && confirm('Are you sure you want to remove this session?')) {
        await this.removeBacktestSession(this.selectedSession.id)
        this.slideOver.showDetail = false
        this.clearSelectedSession()
      }
    },
    confirmPurge () {
      this.showPurgeConfirm = true
    },
    async purgeSessions () {
      await this.purgeBacktestSessions()
      this.showPurgeConfirm = false
    }
  }
}
</script>

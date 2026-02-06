<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Monte Carlo History</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View and manage your past Monte Carlo simulation sessions
          </p>
        </div>
        <router-link to="/monte-carlo/1" class="btn-primary">
          New Simulation
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
      width="max-w-3xl"
    >
      <div v-if="selectedSession" class="p-4">
        <SessionCard
          :session="selectedSession"
          :show-rerun="true"
          @update-notes="updateNotes"
          @rerun="rerunSession"
          @remove="removeSelectedSession"
        />

        <!-- Equity Curves -->
        <div v-if="equityCurves && equityCurves.length > 0" class="mt-6">
          <h4 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Equity Curves</h4>
          <ScenarioChart :equity-curves="equityCurves" />
        </div>

        <!-- Statistics -->
        <div v-if="selectedSession.statistics" class="mt-6">
          <h4 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Statistics</h4>
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <span class="text-xs text-gray-500 dark:text-gray-400">Median Return</span>
              <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {{ formatPercent(selectedSession.statistics.median_return) }}
              </p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <span class="text-xs text-gray-500 dark:text-gray-400">Worst Case Return</span>
              <p class="text-lg font-semibold text-red-600 dark:text-red-400">
                {{ formatPercent(selectedSession.statistics.worst_case_return) }}
              </p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <span class="text-xs text-gray-500 dark:text-gray-400">Best Case Return</span>
              <p class="text-lg font-semibold text-green-600 dark:text-green-400">
                {{ formatPercent(selectedSession.statistics.best_case_return) }}
              </p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <span class="text-xs text-gray-500 dark:text-gray-400">Probability of Profit</span>
              <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {{ formatPercent(selectedSession.statistics.probability_of_profit * 100) }}
              </p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <span class="text-xs text-gray-500 dark:text-gray-400">Max Drawdown (Median)</span>
              <p class="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                {{ formatPercent(selectedSession.statistics.median_max_drawdown) }}
              </p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <span class="text-xs text-gray-500 dark:text-gray-400">VaR (95%)</span>
              <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {{ formatPercent(selectedSession.statistics.var_95) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </SlideOver>

    <!-- Confirm Purge Modal -->
    <SimpleConfirmModal
      :show="showPurgeConfirm"
      title="Purge All Sessions"
      message="Are you sure you want to delete all Monte Carlo sessions? This action cannot be undone."
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
      empty-message="No Monte Carlo sessions found. Run a simulation to see it here."
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
import { useMonteCarloStore } from '@/stores/monteCarlo'
import SessionsList from '@/components/Sessions/SessionsList'
import SessionCard from '@/components/Sessions/SessionCard'
import SessionFilters from '@/components/Sessions/SessionFilters'
import SlideOver from '@/components/Functional/SlideOver'
import SimpleConfirmModal from '@/components/Modals/SimpleConfirmModal'
import ScenarioChart from '@/components/MonteCarlo/ScenarioChart'
import _ from 'lodash'

export default {
  name: 'MonteCarloHistory',
  components: {
    SessionsList,
    SessionCard,
    SessionFilters,
    SlideOver,
    SimpleConfirmModal,
    ScenarioChart
  },
  data () {
    return {
      columns: [
        { key: 'created_at', label: 'Date' },
        { key: 'strategy_name', label: 'Strategy' },
        { key: 'exchange', label: 'Exchange' },
        { key: 'symbol', label: 'Symbol' },
        { key: 'num_simulations', label: 'Simulations' },
        { key: 'status', label: 'Status' }
      ],
      slideOver: {
        showDetail: false
      },
      showPurgeConfirm: false,
      equityCurves: null
    }
  },
  computed: {
    ...mapState(useSessionsStore, ['monteCarloSessions', 'loading', 'filters', 'selectedSession']),
    filteredSessions () {
      const store = useSessionsStore()
      return store.filteredMonteCarloSessions
    }
  },
  created () {
    this.fetchSessions()
  },
  methods: {
    ...mapActions(useSessionsStore, [
      'fetchMonteCarloSessions',
      'fetchMonteCarloSession',
      'removeMonteCarloSession',
      'fetchMonteCarloEquityCurves',
      'purgeMonteCarloSessions',
      'clearSelectedSession'
    ]),
    async fetchSessions () {
      await this.fetchMonteCarloSessions()
    },
    async selectSession (session) {
      await this.fetchMonteCarloSession(session.id)
      // Fetch equity curves
      const curves = await this.fetchMonteCarloEquityCurves(session.id)
      if (curves && curves.equity_curves) {
        this.equityCurves = curves.equity_curves.map(curve => {
          return curve.map(point => ({
            value: point.balance,
            time: point.timestamp
          }))
        })
      }
      this.slideOver.showDetail = true
    },
    async viewSession (session) {
      await this.selectSession(session)
    },
    async updateNotes (notes) {
      // Monte Carlo may not have notes endpoint, handle gracefully
    },
    async rerunSession () {
      if (this.selectedSession) {
        const monteCarlo = useMonteCarloStore()
        // Create a new tab with the session's configuration
        const tab = {
          form: {
            start_date: this.selectedSession.start_date,
            finish_date: this.selectedSession.finish_date,
            debug_mode: this.selectedSession.debug_mode || false,
            routes: this.selectedSession.routes || [],
            extra_routes: this.selectedSession.extra_routes || [],
            num_simulations: this.selectedSession.num_simulations || 100,
            initial_balance: this.selectedSession.initial_balance || 10000,
            spread: this.selectedSession.spread || 0.005,
            slippage: this.selectedSession.slippage || 0.001,
            fee: this.selectedSession.fee || 0.001
          }
        }
        // Navigate to monte carlo
        this.$router.push('/monte-carlo/1')
        // Update the form in the store
        Object.assign(monteCarlo.tabs[1].form, tab.form)
      }
    },
    async rerunFromList (session) {
      await this.fetchMonteCarloSession(session.id)
      await this.rerunSession()
    },
    async removeSession (session) {
      if (confirm('Are you sure you want to remove this session?')) {
        await this.removeMonteCarloSession(session.id)
      }
    },
    async removeSelectedSession () {
      if (this.selectedSession && confirm('Are you sure you want to remove this session?')) {
        await this.removeMonteCarloSession(this.selectedSession.id)
        this.slideOver.showDetail = false
        this.clearSelectedSession()
      }
    },
    confirmPurge () {
      this.showPurgeConfirm = true
    },
    async purgeSessions () {
      await this.purgeMonteCarloSessions()
      this.showPurgeConfirm = false
    },
    formatPercent (value) {
      if (value === null || value === undefined) return '-'
      return `${_.round(value, 2)}%`
    }
  }
}
</script>

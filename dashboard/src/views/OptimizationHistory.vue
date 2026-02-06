<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Optimization History</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View and manage your past optimization sessions
          </p>
        </div>
        <router-link to="/optimization/1" class="btn-primary">
          New Optimization
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
      <div v-if="selectedSession" class="p-4">
        <SessionCard
          :session="selectedSession"
          :show-rerun="true"
          @update-notes="updateNotes"
          @rerun="rerunSession"
          @remove="removeSelectedSession"
        />

        <!-- Best Candidates -->
        <div v-if="selectedSession.best_candidates && selectedSession.best_candidates.length" class="mt-6">
          <h4 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Best Candidates</h4>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Rank</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">DNA</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fitness</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Win Rate</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">PNL</th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-backdrop-dark divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="candidate in selectedSession.best_candidates" :key="candidate.rank">
                  <td class="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">#{{ candidate.rank }}</td>
                  <td class="px-4 py-2 text-sm font-mono text-gray-600 dark:text-gray-400">{{ candidate.dna }}</td>
                  <td class="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{{ candidate.fitness }}</td>
                  <td class="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                    {{ candidate.training_win_rate }}% | {{ candidate.testing_win_rate }}%
                  </td>
                  <td class="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                    {{ candidate.training_pnl }}% | {{ candidate.testing_pnl }}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Resume/Rerun Actions -->
        <div v-if="selectedSession && !selectedSession.completed" class="mt-6 flex space-x-3">
          <button class="btn-primary" @click="resumeSession">
            Resume Optimization
          </button>
        </div>
      </div>
    </SlideOver>

    <!-- Confirm Purge Modal -->
    <SimpleConfirmModal
      :show="showPurgeConfirm"
      title="Purge All Sessions"
      message="Are you sure you want to delete all optimization sessions? This action cannot be undone."
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
      empty-message="No optimization sessions found. Run an optimization to see it here."
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
import { useOptimizationStore } from '@/stores/optimization'
import SessionsList from '@/components/Sessions/SessionsList'
import SessionCard from '@/components/Sessions/SessionCard'
import SessionFilters from '@/components/Sessions/SessionFilters'
import SlideOver from '@/components/Functional/SlideOver'
import SimpleConfirmModal from '@/components/Modals/SimpleConfirmModal'

export default {
  name: 'OptimizationHistory',
  components: {
    SessionsList,
    SessionCard,
    SessionFilters,
    SlideOver,
    SimpleConfirmModal
  },
  data () {
    return {
      columns: [
        { key: 'created_at', label: 'Date' },
        { key: 'strategy_name', label: 'Strategy' },
        { key: 'exchange', label: 'Exchange' },
        { key: 'symbol', label: 'Symbol' },
        { key: 'timeframe', label: 'Timeframe' },
        { key: 'optimal_total', label: 'Optimal Total' },
        { key: 'status', label: 'Status' }
      ],
      slideOver: {
        showDetail: false
      },
      showPurgeConfirm: false
    }
  },
  computed: {
    ...mapState(useSessionsStore, ['optimizationSessions', 'loading', 'filters', 'selectedSession']),
    filteredSessions () {
      const store = useSessionsStore()
      return store.filteredOptimizationSessions
    }
  },
  created () {
    this.fetchSessions()
  },
  methods: {
    ...mapActions(useSessionsStore, [
      'fetchOptimizationSessions',
      'fetchOptimizationSession',
      'removeOptimizationSession',
      'updateOptimizationSessionNotes',
      'resumeOptimization',
      'rerunOptimization',
      'purgeOptimizationSessions',
      'clearSelectedSession'
    ]),
    async fetchSessions () {
      await this.fetchOptimizationSessions()
    },
    async selectSession (session) {
      await this.fetchOptimizationSession(session.id)
      this.slideOver.showDetail = true
    },
    async viewSession (session) {
      await this.fetchOptimizationSession(session.id)
      this.slideOver.showDetail = true
    },
    async updateNotes (notes) {
      if (this.selectedSession) {
        await this.updateOptimizationSessionNotes(this.selectedSession.id, notes)
      }
    },
    async resumeSession () {
      if (this.selectedSession) {
        await this.resumeOptimization(this.selectedSession.id)
        this.$router.push('/optimization/1')
      }
    },
    async rerunSession () {
      if (this.selectedSession) {
        const optimization = useOptimizationStore()
        // Create a new tab with the session's configuration
        const tab = {
          form: {
            start_date: this.selectedSession.start_date,
            finish_date: this.selectedSession.finish_date,
            debug_mode: this.selectedSession.debug_mode || false,
            export_csv: this.selectedSession.export_csv || false,
            export_json: this.selectedSession.export_json || false,
            routes: this.selectedSession.routes || [],
            extra_routes: this.selectedSession.extra_routes || [],
            optimal_total: this.selectedSession.optimal_total || 50
          }
        }
        // Navigate to optimization
        this.$router.push('/optimization/1')
        // Update the form in the store
        Object.assign(optimization.tabs[1].form, tab.form)
      }
    },
    async rerunFromList (session) {
      await this.fetchOptimizationSession(session.id)
      await this.rerunSession()
    },
    async removeSession (session) {
      if (confirm('Are you sure you want to remove this session?')) {
        await this.removeOptimizationSession(session.id)
      }
    },
    async removeSelectedSession () {
      if (this.selectedSession && confirm('Are you sure you want to remove this session?')) {
        await this.removeOptimizationSession(this.selectedSession.id)
        this.slideOver.showDetail = false
        this.clearSelectedSession()
      }
    },
    confirmPurge () {
      this.showPurgeConfirm = true
    },
    async purgeSessions () {
      await this.purgeOptimizationSessions()
      this.showPurgeConfirm = false
    }
  }
}
</script>

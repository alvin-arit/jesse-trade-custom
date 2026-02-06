import { defineStore } from 'pinia'
import axios from '@/http'
import notifier from '../notifier'
import helpers from '@/helpers'

export const useSessionsStore = defineStore({
  id: 'sessions',
  state: () => ({
    backtestSessions: [],
    optimizationSessions: [],
    monteCarloSessions: [],
    liveSessions: [],
    loading: false,
    filters: {
      search: '',
      dateFrom: '',
      dateTo: '',
      status: 'all' // all, completed, failed
    },
    pagination: {
      page: 1,
      perPage: 20,
      total: 0
    },
    selectedSession: null,
    sessionChartData: null,
    sessionStrategyCode: null,
    sessionLogs: ''
  }),
  getters: {
    filteredBacktestSessions: (state) => {
      return state.backtestSessions.filter(session => {
        if (state.filters.search) {
          const searchLower = state.filters.search.toLowerCase()
          const matchesStrategy = session.strategy_name?.toLowerCase().includes(searchLower)
          const matchesSymbol = session.symbol?.toLowerCase().includes(searchLower)
          const matchesExchange = session.exchange?.toLowerCase().includes(searchLower)
          if (!matchesStrategy && !matchesSymbol && !matchesExchange) return false
        }
        if (state.filters.status !== 'all') {
          if (state.filters.status === 'completed' && !session.completed) return false
          if (state.filters.status === 'failed' && session.completed) return false
        }
        return true
      })
    },
    filteredOptimizationSessions: (state) => {
      return state.optimizationSessions.filter(session => {
        if (state.filters.search) {
          const searchLower = state.filters.search.toLowerCase()
          const matchesStrategy = session.strategy_name?.toLowerCase().includes(searchLower)
          const matchesSymbol = session.symbol?.toLowerCase().includes(searchLower)
          if (!matchesStrategy && !matchesSymbol) return false
        }
        if (state.filters.status !== 'all') {
          if (state.filters.status === 'completed' && !session.completed) return false
          if (state.filters.status === 'failed' && session.completed) return false
        }
        return true
      })
    },
    filteredMonteCarloSessions: (state) => {
      return state.monteCarloSessions.filter(session => {
        if (state.filters.search) {
          const searchLower = state.filters.search.toLowerCase()
          const matchesStrategy = session.strategy_name?.toLowerCase().includes(searchLower)
          if (!matchesStrategy) return false
        }
        return true
      })
    }
  },
  actions: {
    // Backtest Sessions
    async fetchBacktestSessions () {
      this.loading = true
      try {
        const res = await axios.post('/backtest/sessions')
        this.backtestSessions = res.data.sessions || []
      } catch (error) {
        notifier.error(`Failed to fetch backtest sessions: ${error.response?.statusText || error.message}`)
      } finally {
        this.loading = false
      }
    },

    async fetchBacktestSession (id) {
      this.loading = true
      try {
        const res = await axios.post(`/backtest/sessions/${id}`)
        this.selectedSession = res.data
        return res.data
      } catch (error) {
        notifier.error(`Failed to fetch session: ${error.response?.statusText || error.message}`)
        return null
      } finally {
        this.loading = false
      }
    },

    async removeBacktestSession (id) {
      try {
        await axios.post(`/backtest/sessions/${id}/remove`)
        this.backtestSessions = this.backtestSessions.filter(s => s.id !== id)
        notifier.success('Session removed successfully')
      } catch (error) {
        notifier.error(`Failed to remove session: ${error.response?.statusText || error.message}`)
      }
    },

    async updateBacktestSessionNotes (id, notes) {
      try {
        await axios.post(`/backtest/sessions/${id}/notes`, { notes })
        const session = this.backtestSessions.find(s => s.id === id)
        if (session) session.notes = notes
        notifier.success('Notes updated')
      } catch (error) {
        notifier.error(`Failed to update notes: ${error.response?.statusText || error.message}`)
      }
    },

    async fetchBacktestChartData (id) {
      try {
        const res = await axios.post(`/backtest/sessions/${id}/chart-data`)
        this.sessionChartData = res.data
        return res.data
      } catch (error) {
        notifier.error(`Failed to fetch chart data: ${error.response?.statusText || error.message}`)
        return null
      }
    },

    async fetchBacktestStrategyCode (id) {
      try {
        const res = await axios.post(`/backtest/sessions/${id}/strategy-code`)
        this.sessionStrategyCode = res.data.code
        return res.data.code
      } catch (error) {
        notifier.error(`Failed to fetch strategy code: ${error.response?.statusText || error.message}`)
        return null
      }
    },

    async fetchBacktestLogs (id) {
      try {
        const res = await axios.get(`/backtest/logs/${id}`)
        this.sessionLogs = res.data.logs || ''
        return res.data.logs
      } catch (error) {
        notifier.error(`Failed to fetch logs: ${error.response?.statusText || error.message}`)
        return ''
      }
    },

    async purgeBacktestSessions () {
      try {
        await axios.post('/backtest/purge-sessions')
        this.backtestSessions = []
        notifier.success('All sessions purged')
      } catch (error) {
        notifier.error(`Failed to purge sessions: ${error.response?.statusText || error.message}`)
      }
    },

    // Optimization Sessions
    async fetchOptimizationSessions () {
      this.loading = true
      try {
        const res = await axios.post('/optimization/sessions')
        this.optimizationSessions = res.data.sessions || []
      } catch (error) {
        notifier.error(`Failed to fetch optimization sessions: ${error.response?.statusText || error.message}`)
      } finally {
        this.loading = false
      }
    },

    async fetchOptimizationSession (id) {
      this.loading = true
      try {
        const res = await axios.post(`/optimization/sessions/${id}`)
        this.selectedSession = res.data
        return res.data
      } catch (error) {
        notifier.error(`Failed to fetch session: ${error.response?.statusText || error.message}`)
        return null
      } finally {
        this.loading = false
      }
    },

    async removeOptimizationSession (id) {
      try {
        await axios.post(`/optimization/sessions/${id}/remove`)
        this.optimizationSessions = this.optimizationSessions.filter(s => s.id !== id)
        notifier.success('Session removed successfully')
      } catch (error) {
        notifier.error(`Failed to remove session: ${error.response?.statusText || error.message}`)
      }
    },

    async updateOptimizationSessionNotes (id, notes) {
      try {
        await axios.post(`/optimization/sessions/${id}/notes`, { notes })
        const session = this.optimizationSessions.find(s => s.id === id)
        if (session) session.notes = notes
        notifier.success('Notes updated')
      } catch (error) {
        notifier.error(`Failed to update notes: ${error.response?.statusText || error.message}`)
      }
    },

    async resumeOptimization (sessionId) {
      try {
        const res = await axios.post('/optimization/resume', { session_id: sessionId })
        notifier.success('Optimization resumed')
        return res.data
      } catch (error) {
        notifier.error(`Failed to resume optimization: ${error.response?.statusText || error.message}`)
        return null
      }
    },

    async rerunOptimization (sessionId) {
      try {
        const res = await axios.post('/optimization/rerun', { session_id: sessionId })
        notifier.success('Optimization restarted')
        return res.data
      } catch (error) {
        notifier.error(`Failed to rerun optimization: ${error.response?.statusText || error.message}`)
        return null
      }
    },

    async terminateOptimization () {
      try {
        await axios.post('/optimization/terminate')
        notifier.success('Optimization terminated')
      } catch (error) {
        notifier.error(`Failed to terminate optimization: ${error.response?.statusText || error.message}`)
      }
    },

    async purgeOptimizationSessions () {
      try {
        await axios.post('/optimization/purge-sessions')
        this.optimizationSessions = []
        notifier.success('All sessions purged')
      } catch (error) {
        notifier.error(`Failed to purge sessions: ${error.response?.statusText || error.message}`)
      }
    },

    // Monte Carlo Sessions
    async fetchMonteCarloSessions () {
      this.loading = true
      try {
        const res = await axios.post('/monte-carlo/sessions')
        this.monteCarloSessions = res.data.sessions || []
      } catch (error) {
        notifier.error(`Failed to fetch Monte Carlo sessions: ${error.response?.statusText || error.message}`)
      } finally {
        this.loading = false
      }
    },

    async fetchMonteCarloSession (id) {
      this.loading = true
      try {
        const res = await axios.post(`/monte-carlo/sessions/${id}`)
        this.selectedSession = res.data
        return res.data
      } catch (error) {
        notifier.error(`Failed to fetch session: ${error.response?.statusText || error.message}`)
        return null
      } finally {
        this.loading = false
      }
    },

    async removeMonteCarloSession (id) {
      try {
        await axios.post(`/monte-carlo/sessions/${id}/remove`)
        this.monteCarloSessions = this.monteCarloSessions.filter(s => s.id !== id)
        notifier.success('Session removed successfully')
      } catch (error) {
        notifier.error(`Failed to remove session: ${error.response?.statusText || error.message}`)
      }
    },

    async fetchMonteCarloEquityCurves (id) {
      try {
        const res = await axios.post(`/monte-carlo/sessions/${id}/equity-curves`)
        return res.data
      } catch (error) {
        notifier.error(`Failed to fetch equity curves: ${error.response?.statusText || error.message}`)
        return null
      }
    },

    async purgeMonteCarloSessions () {
      try {
        await axios.post('/monte-carlo/purge-sessions')
        this.monteCarloSessions = []
        notifier.success('All sessions purged')
      } catch (error) {
        notifier.error(`Failed to purge sessions: ${error.response?.statusText || error.message}`)
      }
    },

    // Live Sessions
    async fetchLiveSessions () {
      this.loading = true
      try {
        const res = await axios.post('/live/sessions')
        this.liveSessions = res.data.sessions || []
      } catch (error) {
        notifier.error(`Failed to fetch live sessions: ${error.response?.statusText || error.message}`)
      } finally {
        this.loading = false
      }
    },

    async fetchLiveLogs (sessionId) {
      try {
        const res = await axios.post('/live/logs', { session_id: sessionId })
        return res.data.logs || ''
      } catch (error) {
        notifier.error(`Failed to fetch logs: ${error.response?.statusText || error.message}`)
        return ''
      }
    },

    async fetchLiveOrders (sessionId) {
      try {
        const res = await axios.post('/live/orders', { session_id: sessionId })
        return res.data.orders || []
      } catch (error) {
        notifier.error(`Failed to fetch orders: ${error.response?.statusText || error.message}`)
        return []
      }
    },

    // Utility
    clearFilters () {
      this.filters = {
        search: '',
        dateFrom: '',
        dateTo: '',
        status: 'all'
      }
    },

    clearSelectedSession () {
      this.selectedSession = null
      this.sessionChartData = null
      this.sessionStrategyCode = null
      this.sessionLogs = ''
    },

    formatDate (timestamp) {
      return helpers.timestampToDate(timestamp)
    },

    formatDateTime (timestamp) {
      return helpers.timestampToTime(timestamp)
    }
  }
})

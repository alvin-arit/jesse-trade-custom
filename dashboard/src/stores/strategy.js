import { defineStore } from 'pinia'
import axios from '@/http'
import notifier from '../notifier'

export const useStrategyStore = defineStore({
  id: 'strategy',
  state: () => ({
    strategies: [],
    loading: false,
    selectedStrategy: null,
    strategyCode: '',
    periods: [],
    // Jesse.trade browser
    jesseTradeSlugs: [],
    browsingStrategy: null,
    browsingMetrics: null
  }),
  getters: {
    strategyNames: (state) => state.strategies.map(s => s.name),
    sortedStrategies: (state) => {
      return [...state.strategies].sort((a, b) => a.name.localeCompare(b.name))
    }
  },
  actions: {
    // Fetch all local strategies
    async fetchStrategies () {
      this.loading = true
      try {
        const res = await axios.get('/strategy/all')
        this.strategies = res.data.strategies || []
      } catch (error) {
        notifier.error(`Failed to fetch strategies: ${error.response?.statusText || error.message}`)
      } finally {
        this.loading = false
      }
    },

    // Get a specific strategy's code
    async getStrategy (name) {
      this.loading = true
      try {
        const res = await axios.post('/strategy/get', { name })
        this.selectedStrategy = {
          name,
          code: res.data.code,
          path: res.data.path
        }
        this.strategyCode = res.data.code
        return res.data
      } catch (error) {
        notifier.error(`Failed to get strategy: ${error.response?.statusText || error.message}`)
        return null
      } finally {
        this.loading = false
      }
    },

    // Save strategy code
    async saveStrategy (name, code) {
      try {
        await axios.post('/strategy/save', { name, code })
        notifier.success('Strategy saved successfully')
        // Update local state
        if (this.selectedStrategy && this.selectedStrategy.name === name) {
          this.selectedStrategy.code = code
          this.strategyCode = code
        }
        return true
      } catch (error) {
        notifier.error(`Failed to save strategy: ${error.response?.statusText || error.message}`)
        return false
      }
    },

    // Delete a strategy
    async deleteStrategy (name) {
      try {
        await axios.post('/strategy/delete', { name })
        this.strategies = this.strategies.filter(s => s.name !== name)
        if (this.selectedStrategy && this.selectedStrategy.name === name) {
          this.selectedStrategy = null
          this.strategyCode = ''
        }
        notifier.success('Strategy deleted successfully')
        return true
      } catch (error) {
        notifier.error(`Failed to delete strategy: ${error.response?.statusText || error.message}`)
        return false
      }
    },

    // Fetch strategy periods/timeframes
    async fetchPeriods () {
      try {
        const res = await axios.get('/strategy/periods')
        this.periods = res.data.periods || []
        return res.data.periods
      } catch (error) {
        notifier.error(`Failed to fetch periods: ${error.response?.statusText || error.message}`)
        return []
      }
    },

    // Jesse.trade browser methods
    async fetchJesseTradeIndex () {
      this.loading = true
      try {
        const res = await axios.get('/strategy/index')
        this.jesseTradeSlugs = res.data.strategies || []
        return res.data.strategies
      } catch (error) {
        notifier.error(`Failed to fetch strategy index: ${error.response?.statusText || error.message}`)
        return []
      } finally {
        this.loading = false
      }
    },

    async fetchJesseTradeStrategy (slug) {
      this.loading = true
      try {
        const res = await axios.get(`/strategy/jesse-trade/${slug}`)
        this.browsingStrategy = res.data
        return res.data
      } catch (error) {
        notifier.error(`Failed to fetch strategy: ${error.response?.statusText || error.message}`)
        return null
      } finally {
        this.loading = false
      }
    },

    async fetchJesseTradeMetrics (slug) {
      try {
        const res = await axios.get(`/strategy/jesse-trade/${slug}/metrics`)
        this.browsingMetrics = res.data
        return res.data
      } catch (error) {
        // Metrics might not exist for all strategies
        this.browsingMetrics = null
        return null
      }
    },

    // Import strategy from jesse.trade
    async importStrategy (slug, name) {
      try {
        await axios.post('/strategy/import', { slug, name })
        notifier.success('Strategy imported successfully')
        // Refresh strategies list
        await this.fetchStrategies()
        return true
      } catch (error) {
        notifier.error(`Failed to import strategy: ${error.response?.statusText || error.message}`)
        return false
      }
    },

    // Clear selection
    clearSelection () {
      this.selectedStrategy = null
      this.strategyCode = ''
    },

    clearBrowsing () {
      this.browsingStrategy = null
      this.browsingMetrics = null
    }
  }
})

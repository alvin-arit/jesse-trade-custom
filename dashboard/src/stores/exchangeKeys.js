import { defineStore } from 'pinia'
import axios from '@/http'
import notifier from '../notifier'

export const useExchangeKeysStore = defineStore({
  id: 'exchangeKeys',
  state: () => ({
    apiKeys: [],
    supportedSymbols: {},
    loading: false
  }),
  getters: {
    getKeysByExchange: (state) => (exchange) => {
      return state.apiKeys.filter(key => key.exchange === exchange)
    },
    exchanges: (state) => {
      return [...new Set(state.apiKeys.map(key => key.exchange))]
    }
  },
  actions: {
    async fetchApiKeys () {
      this.loading = true
      try {
        const res = await axios.get('/exchange/api-keys')
        this.apiKeys = res.data.api_keys || []
      } catch (error) {
        notifier.error(`Failed to fetch API keys: ${error.response?.statusText || error.message}`)
      } finally {
        this.loading = false
      }
    },

    async storeApiKey (keyData) {
      try {
        await axios.post('/exchange/api-keys/store', keyData)
        notifier.success('API key saved successfully')
        // Refresh the list
        await this.fetchApiKeys()
        return true
      } catch (error) {
        notifier.error(`Failed to save API key: ${error.response?.statusText || error.message}`)
        return false
      }
    },

    async deleteApiKey (id) {
      try {
        await axios.post('/exchange/api-keys/delete', { id })
        this.apiKeys = this.apiKeys.filter(key => key.id !== id)
        notifier.success('API key deleted successfully')
        return true
      } catch (error) {
        notifier.error(`Failed to delete API key: ${error.response?.statusText || error.message}`)
        return false
      }
    },

    async fetchSupportedSymbols (exchange) {
      try {
        const res = await axios.post('/exchange/supported-symbols', { exchange })
        this.supportedSymbols[exchange] = res.data.symbols || []
        return res.data.symbols
      } catch (error) {
        notifier.error(`Failed to fetch symbols: ${error.response?.statusText || error.message}`)
        return []
      }
    }
  }
})

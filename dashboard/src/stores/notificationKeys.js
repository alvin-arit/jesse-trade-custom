import { defineStore } from 'pinia'
import axios from '@/http'
import notifier from '../notifier'

export const useNotificationKeysStore = defineStore({
  id: 'notificationKeys',
  state: () => ({
    apiKeys: [],
    loading: false,
    supportedDrivers: ['telegram', 'discord']
  }),
  getters: {
    getKeysByDriver: (state) => (driver) => {
      return state.apiKeys.filter(key => key.driver === driver)
    }
  },
  actions: {
    async fetchApiKeys () {
      this.loading = true
      try {
        const res = await axios.get('/notification/api-keys')
        this.apiKeys = res.data.api_keys || []
      } catch (error) {
        notifier.error(`Failed to fetch notification keys: ${error.response?.statusText || error.message}`)
      } finally {
        this.loading = false
      }
    },

    async storeApiKey (keyData) {
      try {
        await axios.post('/notification/api-keys/store', keyData)
        notifier.success('Notification key saved successfully')
        // Refresh the list
        await this.fetchApiKeys()
        return true
      } catch (error) {
        notifier.error(`Failed to save notification key: ${error.response?.statusText || error.message}`)
        return false
      }
    },

    async deleteApiKey (id) {
      try {
        await axios.post('/notification/api-keys/delete', { id })
        this.apiKeys = this.apiKeys.filter(key => key.id !== id)
        notifier.success('Notification key deleted successfully')
        return true
      } catch (error) {
        notifier.error(`Failed to delete notification key: ${error.response?.statusText || error.message}`)
        return false
      }
    }
  }
})

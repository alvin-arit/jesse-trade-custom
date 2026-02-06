<template>
  <div class="space-y-6">
    <Card>
      <div class="flex items-center justify-between mb-4">
        <Heading>Exchange API Keys</Heading>
        <button class="btn-primary text-sm" @click="showAddModal = true">
          Add API Key
        </button>
      </div>

      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Manage your exchange API keys for live trading. These are stored securely and used to connect to exchanges.
      </p>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-8">
        <Spinner />
      </div>

      <!-- Empty State -->
      <div v-else-if="apiKeys.length === 0" class="text-center py-8">
        <KeyIcon class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No API keys</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Add your first exchange API key to start live trading.
        </p>
      </div>

      <!-- API Keys List -->
      <div v-else class="space-y-4">
        <div v-for="key in apiKeys" :key="key.id"
             class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <span class="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                  {{ key.exchange?.charAt(0).toUpperCase() }}
                </span>
              </div>
            </div>
            <div class="ml-4">
              <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100">
                {{ key.name || key.exchange }}
              </h4>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ key.exchange }} - {{ maskKey(key.api_key) }}
              </p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <button class="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                    @click="editKey(key)">
              <PencilIcon class="h-5 w-5" />
            </button>
            <button class="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    @click="confirmDelete(key)">
              <TrashIcon class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </Card>

    <!-- Add/Edit Modal -->
    <div v-if="showAddModal" class="fixed z-50 inset-0 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen px-4">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75" @click="closeModal"/>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl z-10 max-w-md w-full p-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            {{ editingKey ? 'Edit API Key' : 'Add API Key' }}
          </h3>

          <form class="space-y-4" @submit.prevent="saveKey">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name (optional)
              </label>
              <input
                v-model="formData.name"
                type="text"
                placeholder="My Trading Key"
                class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Exchange
              </label>
              <select
                v-model="formData.exchange"
                required
                class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Select exchange</option>
                <option v-for="exchange in availableExchanges" :key="exchange" :value="exchange">
                  {{ exchange }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                API Key
              </label>
              <input
                v-model="formData.api_key"
                type="text"
                required
                placeholder="Your API key"
                class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
              >
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                API Secret
              </label>
              <input
                v-model="formData.api_secret"
                type="password"
                required
                placeholder="Your API secret"
                class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
              >
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Passphrase (if required)
              </label>
              <input
                v-model="formData.passphrase"
                type="password"
                placeholder="Passphrase"
                class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
              >
            </div>

            <div class="flex justify-end space-x-3 pt-4">
              <button type="button" class="btn-secondary" @click="closeModal">Cancel</button>
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation -->
    <SimpleConfirmModal
      :show="showDeleteConfirm"
      title="Delete API Key"
      :message="`Are you sure you want to delete the API key for '${keyToDelete?.exchange}'? This cannot be undone.`"
      confirm-text="Delete"
      @confirm="deleteKey"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useExchangeKeysStore } from '@/stores/exchangeKeys'
import { useMainStore } from '@/stores/main'
import SimpleConfirmModal from '@/components/Modals/SimpleConfirmModal'
import { KeyIcon, PencilIcon, TrashIcon } from '@heroicons/vue/outline'
import Card from '@/components/Card'
import Heading from '@/components/Heading'

export default {
  name: 'ExchangeApiKeys',
  components: {
    SimpleConfirmModal,
    KeyIcon,
    PencilIcon,
    TrashIcon,
    Card,
    Heading
  },
  data () {
    return {
      showAddModal: false,
      showDeleteConfirm: false,
      editingKey: null,
      keyToDelete: null,
      saving: false,
      formData: {
        name: '',
        exchange: '',
        api_key: '',
        api_secret: '',
        passphrase: ''
      }
    }
  },
  computed: {
    ...mapState(useExchangeKeysStore, ['apiKeys', 'loading']),
    ...mapState(useMainStore, ['exchangeInfo']),
    availableExchanges () {
      return Object.keys(this.exchangeInfo || {})
    }
  },
  created () {
    this.fetchApiKeys()
  },
  methods: {
    ...mapActions(useExchangeKeysStore, ['fetchApiKeys', 'storeApiKey', 'deleteApiKey']),
    maskKey (key) {
      if (!key) return ''
      if (key.length <= 8) return '****'
      return key.substring(0, 4) + '****' + key.substring(key.length - 4)
    },
    editKey (key) {
      this.editingKey = key
      this.formData = {
        id: key.id,
        name: key.name || '',
        exchange: key.exchange,
        api_key: key.api_key || '',
        api_secret: '',
        passphrase: ''
      }
      this.showAddModal = true
    },
    closeModal () {
      this.showAddModal = false
      this.editingKey = null
      this.formData = {
        name: '',
        exchange: '',
        api_key: '',
        api_secret: '',
        passphrase: ''
      }
    },
    async saveKey () {
      this.saving = true
      const success = await this.storeApiKey(this.formData)
      this.saving = false
      if (success) {
        this.closeModal()
      }
    },
    confirmDelete (key) {
      this.keyToDelete = key
      this.showDeleteConfirm = true
    },
    async deleteKey () {
      if (this.keyToDelete) {
        await this.deleteApiKey(this.keyToDelete.id)
        this.showDeleteConfirm = false
        this.keyToDelete = null
      }
    }
  }
}
</script>

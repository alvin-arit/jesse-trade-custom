<template>
  <div class="space-y-6">
    <Card>
      <div class="flex items-center justify-between mb-4">
        <Heading>Notification Keys</Heading>
        <button class="btn-primary text-sm" @click="showAddModal = true">
          Add Notification Key
        </button>
      </div>

      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Configure notification channels to receive alerts about your live trading sessions.
      </p>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-8">
        <Spinner />
      </div>

      <!-- Empty State -->
      <div v-else-if="apiKeys.length === 0" class="text-center py-8">
        <BellIcon class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No notification keys</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Add a Telegram or Discord notification key to stay updated.
        </p>
      </div>

      <!-- Notification Keys List -->
      <div v-else class="space-y-4">
        <div v-for="key in apiKeys" :key="key.id"
             class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div :class="getDriverIconClass(key.driver)"
                   class="w-10 h-10 rounded-full flex items-center justify-center">
                <component :is="getDriverIcon(key.driver)" class="w-5 h-5" />
              </div>
            </div>
            <div class="ml-4">
              <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                {{ key.driver }}
              </h4>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ key.name || 'Default' }}
              </p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <span :class="key.enabled ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'"
                  class="px-2 py-1 text-xs rounded-full">
              {{ key.enabled ? 'Active' : 'Inactive' }}
            </span>
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
            {{ editingKey ? 'Edit Notification Key' : 'Add Notification Key' }}
          </h3>

          <form class="space-y-4" @submit.prevent="saveKey">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name (optional)
              </label>
              <input
                v-model="formData.name"
                type="text"
                placeholder="My Notifications"
                class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Driver
              </label>
              <select
                v-model="formData.driver"
                required
                class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Select driver</option>
                <option value="telegram">Telegram</option>
                <option value="discord">Discord</option>
              </select>
            </div>

            <!-- Telegram Fields -->
            <template v-if="formData.driver === 'telegram'">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bot Token
                </label>
                <input
                  v-model="formData.bot_token"
                  type="text"
                  required
                  placeholder="123456:ABC-DEF..."
                  class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Chat ID
                </label>
                <input
                  v-model="formData.chat_id"
                  type="text"
                  required
                  placeholder="-1001234567890"
                  class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                >
              </div>
            </template>

            <!-- Discord Fields -->
            <template v-if="formData.driver === 'discord'">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Webhook URL
                </label>
                <input
                  v-model="formData.webhook_url"
                  type="text"
                  required
                  placeholder="https://discord.com/api/webhooks/..."
                  class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                >
              </div>
            </template>

            <div class="flex items-center">
              <input
                id="enabled"
                v-model="formData.enabled"
                type="checkbox"
                class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              >
              <label for="enabled" class="ml-2 block text-sm text-gray-900 dark:text-gray-100">
                Enable notifications
              </label>
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
      title="Delete Notification Key"
      :message="`Are you sure you want to delete this ${keyToDelete?.driver} notification key?`"
      confirm-text="Delete"
      @confirm="deleteKey"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useNotificationKeysStore } from '@/stores/notificationKeys'
import SimpleConfirmModal from '@/components/Modals/SimpleConfirmModal'
import { BellIcon, PencilIcon, TrashIcon } from '@heroicons/vue/outline'
import Card from '@/components/Card'
import Heading from '@/components/Heading'

export default {
  name: 'NotificationKeys',
  components: {
    SimpleConfirmModal,
    BellIcon,
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
        driver: '',
        bot_token: '',
        chat_id: '',
        webhook_url: '',
        enabled: true
      }
    }
  },
  computed: {
    ...mapState(useNotificationKeysStore, ['apiKeys', 'loading'])
  },
  created () {
    this.fetchApiKeys()
  },
  methods: {
    ...mapActions(useNotificationKeysStore, ['fetchApiKeys', 'storeApiKey', 'deleteApiKey']),
    getDriverIcon (driver) {
      return driver === 'telegram' ? 'ChatIcon' : 'BellIcon'
    },
    getDriverIconClass (driver) {
      if (driver === 'telegram') {
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
      }
      return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
    },
    editKey (key) {
      this.editingKey = key
      this.formData = {
        id: key.id,
        name: key.name || '',
        driver: key.driver,
        bot_token: key.bot_token || '',
        chat_id: key.chat_id || '',
        webhook_url: key.webhook_url || '',
        enabled: key.enabled !== false
      }
      this.showAddModal = true
    },
    closeModal () {
      this.showAddModal = false
      this.editingKey = null
      this.formData = {
        name: '',
        driver: '',
        bot_token: '',
        chat_id: '',
        webhook_url: '',
        enabled: true
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

<template>
  <div class="space-y-6">
    <Card>
      <Heading>System Information</Heading>
      <div class="mt-4">
        <dl class="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
          <div class="sm:col-span-1">
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Jesse Version</dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100">{{ systemInfo.jesse_version || '-' }}</dd>
          </div>
          <div class="sm:col-span-1">
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Python Version</dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100">{{ systemInfo.python_version || '-' }}</dd>
          </div>
          <div class="sm:col-span-1">
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Operating System</dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100">{{ systemInfo.os || '-' }}</dd>
          </div>
          <div class="sm:col-span-1">
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">CPU Cores</dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100">{{ systemInfo.cpu_cores || '-' }}</dd>
          </div>
          <div class="sm:col-span-1">
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Total RAM</dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100">{{ formatMemory(systemInfo.total_ram) }}</dd>
          </div>
          <div class="sm:col-span-1">
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Live Plugin</dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100">
              <span v-if="hasLivePluginInstalled" class="text-green-600 dark:text-green-400">Installed</span>
              <span v-else class="text-gray-500 dark:text-gray-400">Not installed</span>
            </dd>
          </div>
        </dl>
      </div>
    </Card>

    <Card>
      <div class="flex items-center justify-between mb-4">
        <Heading>Active Workers</Heading>
        <button class="btn-secondary text-sm" @click="fetchActiveWorkers">
          <RefreshIcon class="h-4 w-4 mr-1" />
          Refresh
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loadingWorkers" class="flex justify-center py-8">
        <Spinner />
      </div>

      <!-- Empty State -->
      <div v-else-if="activeWorkers.length === 0" class="text-center py-8">
        <CogIcon class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No active workers</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          No background processes are currently running.
        </p>
      </div>

      <!-- Workers List -->
      <div v-else class="space-y-3">
        <div v-for="worker in activeWorkers" :key="worker.id"
             class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div :class="getWorkerStatusClass(worker.status)"
                   class="w-3 h-3 rounded-full"/>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                {{ worker.type || 'Worker' }} - {{ worker.id }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Started: {{ formatDate(worker.started_at) }}
              </p>
            </div>
          </div>
          <div class="flex items-center">
            <span :class="getWorkerStatusBadgeClass(worker.status)"
                  class="px-2 py-1 text-xs rounded-full">
              {{ worker.status || 'Running' }}
            </span>
          </div>
        </div>
      </div>
    </Card>

    <Card>
      <Heading>Plan Information</Heading>
      <div class="mt-4">
        <dl class="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
          <div class="sm:col-span-1">
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Current Plan</dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100 uppercase">{{ planInfo.plan || 'Free' }}</dd>
          </div>
          <div v-if="planInfo.expires_at" class="sm:col-span-1">
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Expires</dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100">{{ formatDate(planInfo.expires_at) }}</dd>
          </div>
        </dl>
      </div>

      <div v-if="planInfo.plan !== 'premium'" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <a href="https://jesse.trade/pricing" target="_blank"
           class="btn-primary inline-flex items-center text-sm">
          <SparklesIcon class="h-4 w-4 mr-1" />
          Upgrade to Premium
        </a>
      </div>
    </Card>

    <Card v-if="updateInfo && updateInfo.is_update_available">
      <Heading>Update Available</Heading>
      <div class="mt-4">
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          A new version of Jesse is available: <strong>{{ updateInfo.latest_version }}</strong>
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Current version: {{ systemInfo.jesse_version }}
        </p>
        <div class="mt-4">
          <a href="https://docs.jesse.trade/docs/getting-started/update.html" target="_blank"
             class="btn-primary inline-flex items-center text-sm">
            View Update Instructions
          </a>
        </div>
      </div>
    </Card>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useMainStore } from '@/stores/main'
import Card from '@/components/Card'
import Heading from '@/components/Heading'
import Spinner from '@/components/Functional/Spinner'
import { RefreshIcon, CogIcon, SparklesIcon } from '@heroicons/vue/outline'
import helpers from '@/helpers'

export default {
  name: 'SystemInfo',
  components: {
    Card,
    Heading,
    Spinner,
    RefreshIcon,
    CogIcon,
    SparklesIcon
  },
  computed: {
    ...mapState(useMainStore, ['systemInfo', 'updateInfo', 'planInfo', 'hasLivePluginInstalled', 'activeWorkers', 'loadingWorkers'])
  },
  created () {
    this.fetchActiveWorkers()
  },
  methods: {
    ...mapActions(useMainStore, ['fetchActiveWorkers']),
    formatMemory (bytes) {
      if (!bytes) return '-'
      const gb = bytes / (1024 * 1024 * 1024)
      return `${gb.toFixed(1)} GB`
    },
    formatDate (timestamp) {
      if (!timestamp) return '-'
      return helpers.timestampToTime(timestamp)
    },
    getWorkerStatusClass (status) {
      if (status === 'running' || !status) return 'bg-green-500'
      if (status === 'idle') return 'bg-yellow-500'
      return 'bg-gray-500'
    },
    getWorkerStatusBadgeClass (status) {
      if (status === 'running' || !status) {
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
      }
      if (status === 'idle') {
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
      }
      return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400'
    }
  }
}
</script>

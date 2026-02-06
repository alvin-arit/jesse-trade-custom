<template>
  <div class="overflow-hidden">
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <Spinner />
    </div>

    <!-- Empty state -->
    <div v-else-if="sessions.length === 0" class="text-center py-12">
      <DocumentIcon class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No sessions</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {{ emptyMessage || 'No sessions found.' }}
      </p>
    </div>

    <!-- Sessions table -->
    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th v-for="column in columns" :key="column.key"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {{ column.label }}
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-backdrop-dark divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="session in paginatedSessions" :key="session.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
              @click="$emit('select', session)">
            <td v-for="column in columns" :key="column.key" class="px-6 py-4 whitespace-nowrap text-sm">
              <span v-if="column.key === 'created_at'" class="text-gray-900 dark:text-gray-100">
                {{ formatDate(session[column.key]) }}
              </span>
              <span v-else-if="column.key === 'status'" :class="getStatusClass(session)">
                {{ getStatusText(session) }}
              </span>
              <span v-else-if="column.key === 'net_profit'" :class="getProfitClass(session[column.key])">
                {{ formatProfit(session[column.key]) }}
              </span>
              <span v-else class="text-gray-900 dark:text-gray-100">
                {{ session[column.key] || '-' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-3"
                      @click.stop="$emit('view', session)">
                View
              </button>
              <button v-if="showRerun" class="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 mr-3"
                      @click.stop="$emit('rerun', session)">
                Rerun
              </button>
              <button class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                      @click.stop="$emit('remove', session)">
                Remove
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="bg-white dark:bg-backdrop-dark px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
        <div class="flex-1 flex justify-between sm:hidden">
          <button :disabled="currentPage === 1" class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  @click="prevPage">
            Previous
          </button>
          <button :disabled="currentPage === totalPages" class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  @click="nextPage">
            Next
          </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700 dark:text-gray-300">
              Showing
              <span class="font-medium">{{ startIndex + 1 }}</span>
              to
              <span class="font-medium">{{ Math.min(endIndex, sessions.length) }}</span>
              of
              <span class="font-medium">{{ sessions.length }}</span>
              results
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button :disabled="currentPage === 1" class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                      @click="prevPage">
                <ChevronLeftIcon class="h-5 w-5" />
              </button>
              <button v-for="page in visiblePages" :key="page"
                      :class="[
                        page === currentPage
                          ? 'z-10 bg-indigo-50 dark:bg-indigo-900 border-indigo-500 text-indigo-600 dark:text-indigo-300'
                          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700',
                        'relative inline-flex items-center px-4 py-2 border text-sm font-medium'
                      ]"
                      @click="goToPage(page)">
                {{ page }}
              </button>
              <button :disabled="currentPage === totalPages" class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                      @click="nextPage">
                <ChevronRightIcon class="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { DocumentIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/outline'
import helpers from '@/helpers'
import _ from 'lodash'

export default {
  name: 'SessionsList',
  components: {
    DocumentIcon,
    ChevronLeftIcon,
    ChevronRightIcon
  },
  props: {
    sessions: {
      type: Array,
      required: true
    },
    columns: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    },
    emptyMessage: {
      type: String,
      default: ''
    },
    showRerun: {
      type: Boolean,
      default: false
    },
    perPage: {
      type: Number,
      default: 20
    }
  },
  emits: ['select', 'view', 'rerun', 'remove'],
  data () {
    return {
      currentPage: 1
    }
  },
  computed: {
    totalPages () {
      return Math.ceil(this.sessions.length / this.perPage)
    },
    startIndex () {
      return (this.currentPage - 1) * this.perPage
    },
    endIndex () {
      return this.startIndex + this.perPage
    },
    paginatedSessions () {
      return this.sessions.slice(this.startIndex, this.endIndex)
    },
    visiblePages () {
      const pages = []
      const start = Math.max(1, this.currentPage - 2)
      const end = Math.min(this.totalPages, this.currentPage + 2)
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      return pages
    }
  },
  watch: {
    sessions () {
      this.currentPage = 1
    }
  },
  methods: {
    formatDate (timestamp) {
      if (!timestamp) return '-'
      return helpers.timestampToTime(timestamp)
    },
    getStatusClass (session) {
      if (session.completed) {
        return 'text-green-600 dark:text-green-400'
      }
      return 'text-yellow-600 dark:text-yellow-400'
    },
    getStatusText (session) {
      if (session.completed) return 'Completed'
      if (session.error) return 'Failed'
      return 'In Progress'
    },
    getProfitClass (profit) {
      if (profit > 0) return 'text-green-600 dark:text-green-400'
      if (profit < 0) return 'text-red-600 dark:text-red-400'
      return 'text-gray-900 dark:text-gray-100'
    },
    formatProfit (profit) {
      if (profit === null || profit === undefined) return '-'
      const sign = profit >= 0 ? '+' : ''
      return `${sign}${_.round(profit, 2)}%`
    },
    prevPage () {
      if (this.currentPage > 1) this.currentPage--
    },
    nextPage () {
      if (this.currentPage < this.totalPages) this.currentPage++
    },
    goToPage (page) {
      this.currentPage = page
    }
  }
}
</script>

<template>
  <div class="bg-white dark:bg-backdrop-dark p-4 rounded-lg shadow mb-4">
    <div class="flex flex-wrap items-center gap-4">
      <!-- Search -->
      <div class="flex-1 min-w-[200px]">
        <label for="search" class="sr-only">Search</label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon class="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="search"
            v-model="localFilters.search"
            type="text"
            placeholder="Search by strategy, symbol, or exchange..."
            class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            @input="emitFilters"
          >
        </div>
      </div>

      <!-- Status Filter -->
      <div class="w-40">
        <label for="status" class="sr-only">Status</label>
        <select
          id="status"
          v-model="localFilters.status"
          class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          @change="emitFilters"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <!-- Date From -->
      <div v-if="showDateFilters" class="w-40">
        <label for="dateFrom" class="sr-only">From Date</label>
        <input
          id="dateFrom"
          v-model="localFilters.dateFrom"
          type="date"
          class="block w-full pl-3 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          @change="emitFilters"
        >
      </div>

      <!-- Date To -->
      <div v-if="showDateFilters" class="w-40">
        <label for="dateTo" class="sr-only">To Date</label>
        <input
          id="dateTo"
          v-model="localFilters.dateTo"
          type="date"
          class="block w-full pl-3 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          @change="emitFilters"
        >
      </div>

      <!-- Clear Filters -->
      <button
        v-if="hasActiveFilters"
        class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        @click="clearFilters"
      >
        <XIcon class="h-4 w-4 mr-1" />
        Clear
      </button>

      <!-- Purge All Button -->
      <button
        v-if="showPurge"
        class="inline-flex items-center px-3 py-2 border border-red-300 dark:border-red-600 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        @click="$emit('purge')"
      >
        <TrashIcon class="h-4 w-4 mr-1" />
        Purge All
      </button>

      <!-- Refresh Button -->
      <button
        class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        @click="$emit('refresh')"
      >
        <RefreshIcon class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>

<script>
import { SearchIcon, XIcon, RefreshIcon, TrashIcon } from '@heroicons/vue/outline'
import _ from 'lodash'

export default {
  name: 'SessionFilters',
  components: {
    SearchIcon,
    XIcon,
    RefreshIcon,
    TrashIcon
  },
  props: {
    filters: {
      type: Object,
      required: true
    },
    showDateFilters: {
      type: Boolean,
      default: false
    },
    showPurge: {
      type: Boolean,
      default: true
    }
  },
  emits: ['update:filters', 'refresh', 'purge'],
  data () {
    return {
      localFilters: { ...this.filters }
    }
  },
  computed: {
    hasActiveFilters () {
      return this.localFilters.search ||
             this.localFilters.status !== 'all' ||
             this.localFilters.dateFrom ||
             this.localFilters.dateTo
    }
  },
  watch: {
    filters: {
      handler (newVal) {
        this.localFilters = { ...newVal }
      },
      deep: true
    }
  },
  methods: {
    emitFilters: _.debounce(function () {
      this.$emit('update:filters', { ...this.localFilters })
    }, 300),
    clearFilters () {
      this.localFilters = {
        search: '',
        dateFrom: '',
        dateTo: '',
        status: 'all'
      }
      this.$emit('update:filters', { ...this.localFilters })
    }
  }
}
</script>

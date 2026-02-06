<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Strategies</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your trading strategies
          </p>
        </div>
        <div class="flex space-x-3">
          <router-link to="/strategy-browser" class="btn-secondary">
            Browse jesse.trade
          </router-link>
          <button class="btn-primary" @click="openNewStrategyModal">
            New Strategy
          </button>
        </div>
      </div>
    </div>

    <!-- Search -->
    <div class="mb-6">
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon class="h-5 w-5 text-gray-400" />
        </div>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search strategies..."
          class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
      </div>
    </div>

    <!-- Main Content -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Strategy List -->
      <div class="lg:col-span-1">
        <div class="bg-white dark:bg-backdrop-dark shadow rounded-lg p-4">
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Your Strategies</h3>
          <StrategyList
            :strategies="filteredStrategies"
            :loading="loading"
            :selected="selectedStrategy?.name"
            @select="selectStrategy"
            @edit="editStrategy"
            @delete="confirmDelete"
          />
        </div>
      </div>

      <!-- Editor / Details -->
      <div class="lg:col-span-2">
        <div v-if="showEditor" class="bg-white dark:bg-backdrop-dark shadow rounded-lg overflow-hidden h-[600px]">
          <StrategyEditor
            :strategy-name="selectedStrategy.name"
            :code="strategyCode"
            @save="saveStrategy"
            @close="closeEditor"
          />
        </div>

        <div v-else-if="selectedStrategy" class="bg-white dark:bg-backdrop-dark shadow rounded-lg p-6">
          <StrategyCard
            :strategy="selectedStrategy"
            :show-edit="true"
            :show-delete="true"
            @edit="editStrategy(selectedStrategy)"
            @delete="confirmDelete(selectedStrategy)"
          />

          <div class="mt-4">
            <button class="btn-primary w-full" @click="showEditor = true">
              Open in Editor
            </button>
          </div>
        </div>

        <div v-else class="bg-white dark:bg-backdrop-dark shadow rounded-lg p-12 text-center">
          <CodeIcon class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No strategy selected</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Select a strategy from the list to view or edit.
          </p>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <SimpleConfirmModal
      :show="showDeleteConfirm"
      title="Delete Strategy"
      :message="`Are you sure you want to delete '${strategyToDelete?.name}'? This action cannot be undone.`"
      confirm-text="Delete"
      @confirm="deleteStrategy"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useStrategyStore } from '@/stores/strategy'
import StrategyList from '@/components/Strategy/StrategyList'
import StrategyCard from '@/components/Strategy/StrategyCard'
import StrategyEditor from '@/components/Strategy/StrategyEditor'
import SimpleConfirmModal from '@/components/Modals/SimpleConfirmModal'
import { SearchIcon, CodeIcon } from '@heroicons/vue/outline'
import { useMainStore } from '@/stores/main'

export default {
  name: 'Strategies',
  components: {
    StrategyList,
    StrategyCard,
    StrategyEditor,
    SimpleConfirmModal,
    SearchIcon,
    CodeIcon
  },
  data () {
    return {
      searchQuery: '',
      showEditor: false,
      showDeleteConfirm: false,
      strategyToDelete: null
    }
  },
  computed: {
    ...mapState(useStrategyStore, ['strategies', 'loading', 'selectedStrategy', 'strategyCode']),
    filteredStrategies () {
      if (!this.searchQuery) return this.strategies
      const query = this.searchQuery.toLowerCase()
      return this.strategies.filter(s => s.name.toLowerCase().includes(query))
    }
  },
  created () {
    this.fetchStrategies()
  },
  methods: {
    ...mapActions(useStrategyStore, [
      'fetchStrategies',
      'getStrategy',
      'saveStrategy',
      'deleteStrategy',
      'clearSelection'
    ]),
    async selectStrategy (strategy) {
      await this.getStrategy(strategy.name)
      this.showEditor = false
    },
    async editStrategy (strategy) {
      await this.getStrategy(strategy.name)
      this.showEditor = true
    },
    async saveStrategy (code) {
      if (this.selectedStrategy) {
        const store = useStrategyStore()
        await store.saveStrategy(this.selectedStrategy.name, code)
      }
    },
    closeEditor () {
      this.showEditor = false
    },
    confirmDelete (strategy) {
      this.strategyToDelete = strategy
      this.showDeleteConfirm = true
    },
    async deleteStrategy () {
      if (this.strategyToDelete) {
        const store = useStrategyStore()
        await store.deleteStrategy(this.strategyToDelete.name)
        this.showDeleteConfirm = false
        this.strategyToDelete = null
      }
    },
    openNewStrategyModal () {
      const mainStore = useMainStore()
      mainStore.modals.makeStrategy = true
    }
  }
}
</script>

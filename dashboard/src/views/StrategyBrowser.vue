<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Strategy Browser</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Browse and import strategies from jesse.trade
          </p>
        </div>
        <router-link to="/strategies" class="btn-secondary">
          Back to My Strategies
        </router-link>
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

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <Spinner />
    </div>

    <!-- Strategy Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="slug in filteredSlugs" :key="slug"
           class="bg-white dark:bg-backdrop-dark shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
           @click="selectStrategy(slug)">
        <div class="p-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
            {{ formatSlugName(slug) }}
          </h3>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {{ slug }}
          </p>
        </div>
        <div class="px-6 py-3 bg-gray-50 dark:bg-gray-800">
          <button class="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:text-indigo-500"
                  @click.stop="selectStrategy(slug)">
            View Details
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && filteredSlugs.length === 0" class="text-center py-12">
      <GlobeIcon class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No strategies found</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Try a different search term.
      </p>
    </div>

    <!-- Strategy Detail Slide Over -->
    <SlideOver
      name="showDetail"
      :object="slideOver"
      :title="browsingStrategy?.title || formatSlugName(selectedSlug)"
      width="max-w-2xl"
    >
      <div v-if="loadingDetail" class="flex justify-center items-center py-12">
        <Spinner />
      </div>
      <div v-else-if="browsingStrategy" class="p-4">
        <StrategyCard
          :strategy="browsingStrategy"
          :metrics="browsingMetrics"
          :show-import="true"
          :show-view-code="true"
          @import="showImportModal = true"
          @view-code="slideOver.showCode = true"
        />

        <!-- Description -->
        <div v-if="browsingStrategy.description" class="mt-6">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</h4>
          <p class="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
            {{ browsingStrategy.description }}
          </p>
        </div>

        <!-- Requirements -->
        <div v-if="browsingStrategy.requirements && browsingStrategy.requirements.length" class="mt-6">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Requirements</h4>
          <ul class="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
            <li v-for="req in browsingStrategy.requirements" :key="req">{{ req }}</li>
          </ul>
        </div>
      </div>
    </SlideOver>

    <!-- Code Slide Over -->
    <SlideOver
      name="showCode"
      :object="slideOver"
      title="Strategy Code"
      width="max-w-4xl"
    >
      <div v-if="browsingStrategy?.code" class="p-4">
        <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm max-h-[600px] overflow-y-auto"><code>{{ browsingStrategy.code }}</code></pre>
      </div>
    </SlideOver>

    <!-- Import Modal -->
    <SimpleConfirmModal
      :show="showImportModal"
      title="Import Strategy"
      :message="`Import '${formatSlugName(selectedSlug)}' to your strategies?`"
      confirm-text="Import"
      @confirm="importStrategy"
      @cancel="showImportModal = false"
    />

    <!-- Import Name Modal -->
    <div v-if="showNameModal" class="fixed z-50 inset-0 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen px-4">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75" @click="showNameModal = false"/>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl z-10 max-w-md w-full p-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Name Your Strategy</h3>
          <input
            v-model="importName"
            type="text"
            placeholder="Strategy name"
            class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
          <div class="mt-4 flex justify-end space-x-3">
            <button class="btn-secondary" @click="showNameModal = false">Cancel</button>
            <button class="btn-primary" :disabled="!importName" @click="confirmImport">Import</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useStrategyStore } from '@/stores/strategy'
import StrategyCard from '@/components/Strategy/StrategyCard'
import SlideOver from '@/components/Functional/SlideOver'
import SimpleConfirmModal from '@/components/Modals/SimpleConfirmModal'
import { SearchIcon, GlobeIcon } from '@heroicons/vue/outline'

export default {
  name: 'StrategyBrowser',
  components: {
    StrategyCard,
    SlideOver,
    SimpleConfirmModal,
    SearchIcon,
    GlobeIcon
  },
  data () {
    return {
      searchQuery: '',
      selectedSlug: '',
      loadingDetail: false,
      slideOver: {
        showDetail: false,
        showCode: false
      },
      showImportModal: false,
      showNameModal: false,
      importName: ''
    }
  },
  computed: {
    ...mapState(useStrategyStore, ['jesseTradeSlugs', 'loading', 'browsingStrategy', 'browsingMetrics']),
    filteredSlugs () {
      if (!this.searchQuery) return this.jesseTradeSlugs
      const query = this.searchQuery.toLowerCase()
      return this.jesseTradeSlugs.filter(slug =>
        slug.toLowerCase().includes(query) ||
        this.formatSlugName(slug).toLowerCase().includes(query)
      )
    }
  },
  created () {
    this.fetchJesseTradeIndex()
  },
  beforeUnmount () {
    this.clearBrowsing()
  },
  methods: {
    ...mapActions(useStrategyStore, [
      'fetchJesseTradeIndex',
      'fetchJesseTradeStrategy',
      'fetchJesseTradeMetrics',
      'importStrategy',
      'clearBrowsing'
    ]),
    formatSlugName (slug) {
      return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    },
    async selectStrategy (slug) {
      this.selectedSlug = slug
      this.loadingDetail = true
      this.slideOver.showDetail = true

      await this.fetchJesseTradeStrategy(slug)
      await this.fetchJesseTradeMetrics(slug)

      this.loadingDetail = false
    },
    importStrategy () {
      this.showImportModal = false
      this.importName = this.formatSlugName(this.selectedSlug).replace(/\s+/g, '')
      this.showNameModal = true
    },
    async confirmImport () {
      if (!this.importName) return

      const store = useStrategyStore()
      const success = await store.importStrategy(this.selectedSlug, this.importName)

      if (success) {
        this.showNameModal = false
        this.slideOver.showDetail = false
        this.$router.push('/strategies')
      }
    }
  }
}
</script>

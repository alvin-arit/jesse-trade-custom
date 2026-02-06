<template>
  <div class="overflow-hidden">
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <Spinner />
    </div>

    <!-- Empty state -->
    <div v-else-if="strategies.length === 0" class="text-center py-12">
      <CodeIcon class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No strategies</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Get started by creating a new strategy.
      </p>
    </div>

    <!-- Strategy list -->
    <div v-else class="space-y-2">
      <div v-for="strategy in strategies" :key="strategy.name"
           class="flex items-center justify-between p-4 bg-white dark:bg-backdrop-dark border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
           :class="{ 'ring-2 ring-indigo-500': selected === strategy.name }"
           @click="$emit('select', strategy)">
        <div class="flex items-center">
          <CodeIcon class="h-5 w-5 text-gray-400 mr-3" />
          <div>
            <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100">
              {{ strategy.name }}
            </h4>
            <p v-if="strategy.path" class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-md">
              {{ strategy.path }}
            </p>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <button class="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                  title="Edit"
                  @click.stop="$emit('edit', strategy)">
            <PencilIcon class="h-5 w-5" />
          </button>
          <button class="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  title="Delete"
                  @click.stop="$emit('delete', strategy)">
            <TrashIcon class="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { CodeIcon, PencilIcon, TrashIcon } from '@heroicons/vue/outline'

export default {
  name: 'StrategyList',
  components: {
    CodeIcon,
    PencilIcon,
    TrashIcon
  },
  props: {
    strategies: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    },
    selected: {
      type: String,
      default: ''
    }
  },
  emits: ['select', 'edit', 'delete']
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
      <div class="flex items-center">
        <CodeIcon class="h-5 w-5 text-gray-400 mr-2" />
        <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100">
          {{ strategyName }}
        </h3>
        <span v-if="hasChanges" class="ml-2 text-xs text-yellow-600 dark:text-yellow-400">
          (unsaved changes)
        </span>
      </div>
      <div class="flex items-center space-x-2">
        <button :disabled="!hasChanges || saving"
                class="btn-primary text-sm px-3 py-1.5 disabled:opacity-50"
                @click="save">
          <SaveIcon class="h-4 w-4 mr-1 inline" />
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
        <button class="btn-secondary text-sm px-3 py-1.5"
                @click="$emit('close')">
          Close
        </button>
      </div>
    </div>

    <!-- Editor -->
    <div class="flex-1 overflow-hidden">
      <textarea
        ref="editor"
        v-model="localCode"
        class="w-full h-full p-4 font-mono text-sm bg-gray-900 text-gray-100 focus:outline-none resize-none"
        spellcheck="false"
        @keydown.ctrl.s.prevent="save"
        @keydown.meta.s.prevent="save"
      />
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
      <span class="text-xs text-gray-500 dark:text-gray-400">
        Press Ctrl+S (Cmd+S on Mac) to save
      </span>
      <span class="text-xs text-gray-500 dark:text-gray-400">
        {{ lineCount }} lines
      </span>
    </div>
  </div>
</template>

<script>
import { CodeIcon, SaveIcon } from '@heroicons/vue/outline'

export default {
  name: 'StrategyEditor',
  components: {
    CodeIcon,
    SaveIcon
  },
  props: {
    strategyName: {
      type: String,
      required: true
    },
    code: {
      type: String,
      required: true
    }
  },
  emits: ['save', 'close'],
  data () {
    return {
      localCode: this.code,
      originalCode: this.code,
      saving: false
    }
  },
  computed: {
    hasChanges () {
      return this.localCode !== this.originalCode
    },
    lineCount () {
      return this.localCode.split('\n').length
    }
  },
  watch: {
    code (newVal) {
      this.localCode = newVal
      this.originalCode = newVal
    }
  },
  methods: {
    async save () {
      if (!this.hasChanges || this.saving) return

      this.saving = true
      try {
        await this.$emit('save', this.localCode)
        this.originalCode = this.localCode
      } finally {
        this.saving = false
      }
    }
  }
}
</script>

<template>
  <div class="flex items-center justify-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
    <button
      :class="[
        'px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200',
        modelValue === 'summary'
          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
      ]"
      @click="$emit('update:modelValue', 'summary')"
    >
      Summary
    </button>
    <button
      :class="[
        'px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200',
        modelValue === 'detailed'
          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
      ]"
      @click="$emit('update:modelValue', 'detailed')"
    >
      Detailed
    </button>
  </div>
</template>

<script>
export default {
  name: 'ViewToggle',
  props: {
    modelValue: {
      type: String,
      default: 'summary',
      validator: (value) => ['summary', 'detailed'].includes(value)
    }
  },
  emits: ['update:modelValue']
}
</script>

<template>
  <Tabs :page-id="pageId" :tabs="tabs" />

  <MonteCarloTab v-if="tabs[pageId]" :form="tabs[pageId].form" :results="tabs[pageId].results" />
</template>

<script>
import { mapWritableState } from 'pinia'
import { useMonteCarloStore } from '@/stores/monteCarlo'
import MonteCarloTab from '@/views/tabs/MonteCarloTab'
import Tabs from '@/components/Tabs'

export default {
  name: 'MonteCarlo',
  components: {
    Tabs,
    MonteCarloTab,
  },
  computed: {
    ...mapWritableState(useMonteCarloStore, [
      'tabs'
    ]),
    pageId () {
      return parseInt(this.$route.params.id)
    },
  },
}
</script>

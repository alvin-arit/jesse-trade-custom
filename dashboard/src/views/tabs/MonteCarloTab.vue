<template>
  <!-- Debugger Logs -->
  <SlideOver v-if="form.debug_mode"
             name="logsModal"
             :object="results"
             title="Logs">
    <template #default>
      <Logs :logs="results.infoLogs"/>
    </template>

    <template #buttons>
      <button
        class="btn-nav"
        @click="copyInfoLogs">
        <CheckIcon v-if="copiedLogsInfo" class="h-6 w-6" aria-hidden="true"/>
        <ClipboardIcon v-if="!copiedLogsInfo && results.infoLogs.length != 0" class="h-6 w-6" aria-hidden="true"/>
      </button>
      <input id="copy-info-logs" type="hidden" :value="results.infoLogs">
    </template>
  </SlideOver>

  <!-- Execution -->
  <div v-if="results.executing && !results.showResults"
       class="flex flex-col items-center justify-center select-none mt-[10%]"
  >
    <div>
      <CircleProgressbar :progress="results.progressbar.current"/>
    </div>

    <h3 v-if="!results.exception.error" class="mt-8 animate-pulse" v-text="remainingTimeText"/>

    <div class="mt-8">
      <button class="flex justify-center items-center btn-cancel mb-4 w-64"
              @click="cancel($route.params.id)">
        <BanIcon class="w-5 h-5 mr-2"/>
        Cancel
      </button>
    </div>

    <!-- exception  -->
    <div v-if="results.exception.error && results.executing" class="mx-auto container mt-8">
      <Exception :title="results.exception.error"
                 :content="results.exception.traceback"
                 mode="monte-carlo"
                 :debug-mode="form.debug_mode"
                 :session-id="results.generalInfo.session_id"/>
    </div>
  </div>

  <LayoutWithSidebar else>
    <template #left>
      <!-- alert -->
      <div v-if="results.showResults && results.alert.message">
        <Alert :data="results.alert"/>
      </div>

      <!-- Content - Form -->
      <div v-if="!results.executing && !results.showResults">
        <Routes v-if="isInitiated" :form="form" :results="results"/>

        <Divider class="mt-16" title="Simulation Settings"/>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NumberInput title="Number of Simulations" name="num_simulations" :object="form" :default="100"
                       :min="10" :max="1000" />
          <NumberInput title="Initial Balance" name="initial_balance" :object="form" :default="10000"
                       :min="100" />
          <NumberInput title="Spread (%)" name="spread" :object="form" :default="0.005"
                       :step="0.001" />
          <NumberInput title="Slippage (%)" name="slippage" :object="form" :default="0.001"
                       :step="0.001" />
          <NumberInput title="Fee (%)" name="fee" :object="form" :default="0.001"
                       :step="0.001" />
        </div>

        <Divider class="mt-16" title="Advanced Options"/>

        <div class="grid grid-cols-1 gap-6">
          <ToggleButton
            :object="form"
            name="random_starting_equity"
            title="Random Starting Equity"
            description="Vary the starting equity randomly within the specified variance"/>

          <NumberInput v-if="form.random_starting_equity"
                       title="Equity Variance (%)" name="equity_variance" :object="form" :default="0.1"
                       :step="0.01" />

          <ToggleButton
            :object="form"
            name="debug_mode"
            title="Debug Mode"
            description="Logs every step of the execution"/>
        </div>

        <Divider class="mt-16" title="Duration"/>

        <div class="flex items-center select-none flex-1 mb-4">
          <input id="start_date"
                 v-model="form.start_date"
                 type="date"
                 name="start_date"
                 class="dark:bg-backdrop-dark dark:border-gray-900 dark:hover:bg-gray-700 hover:bg-gray-50 flex-1 cursor-pointer focus:ring-indigo-500 focus:border-indigo-500 dark:focus:border-indigo-400 flex justify-center items-center w-48 py-4 text-center sm:text-sm border-gray-300 rounded-l-md border-r-0"
          >

          <input id="finish_date"
                 v-model="form.finish_date"
                 type="date"
                 name="finish_date"
                 class="dark:border-gray-900 dark:hover:bg-gray-700 hover:bg-gray-50 dark:bg-backdrop-dark flex-1 cursor-pointer focus:ring-indigo-500 focus:border-indigo-500 dark:focus:border-indigo-400 flex justify-center items-center w-48 py-4 text-center sm:text-sm border-gray-300 rounded-r-md">
        </div>
      </div>

      <!-- Results -->
      <div v-if="results.showResults" class="w-full mx-auto">
        <div>
          <Divider title="Routes"/>
          <MultipleValuesTable :data="results.routes_info" header/>

          <Divider v-if="hasResults" class="mt-16" title="Monte Carlo Equity Curves"/>
          <ScenarioChart v-if="hasResults && results.charts.equity_curves.length > 0"
                         :equity-curves="results.charts.equity_curves" />

          <Divider v-if="hasResults" class="mt-16" title="Statistics"/>
          <KeyValueTable v-if="hasResults" :data="results.metrics"/>

          <div v-if="!hasResults"
               class="text-yellow-500 border-yellow-400 bg-yellow-50 dark:bg-gray-700 dark:text-yellow-400 mt-16 text-center text-2xl rounded border-2 border-dashed dark:border-gray-800 py-16 select-none"
          >
            No simulations were completed!
          </div>
        </div>
      </div>
    </template>

    <template #right>
      <!-- Action Buttons -->
      <div v-if="!results.executing">
        <div v-if="results.showResults">
          <button class="flex justify-center items-center btn-primary text-center mb-4 w-full"
                  @click="rerun($route.params.id)">
            <RefreshIcon class="w-5 h-5 mr-2"/>
            Rerun
          </button>

          <button class="flex justify-center items-center btn-success text-center mb-4 w-full"
                  @click="newSimulation($route.params.id)">
            <ReplyIcon class="w-5 h-5 mr-2"/>
            New Simulation
          </button>

          <hr class="my-8 border-2 dark:border-gray-600 rounded-full">

          <KeyValueTableSimple :data="results.info"/>
        </div>

        <div v-else>
          <button class="flex items-center justify-center btn-primary text-center mb-4 w-full"
                  @click="start($route.params.id)">
            <LightningBoltIcon class="w-5 h-5 mr-2"/>
            Start Simulation
          </button>

          <button class="flex items-center justify-center btn-secondary text-center mb-4 w-full"
                  @click="startInNewTab($route.params.id)">
            <PlusSmIcon class="w-5 h-5 mr-2"/>
            Start in a new tab
          </button>

          <router-link to="/monte-carlo-history"
                       class="flex items-center justify-center btn-secondary text-center mb-4 w-full">
            <ClockIcon class="w-5 h-5 mr-2"/>
            View History
          </router-link>
        </div>
      </div>
    </template>
  </LayoutWithSidebar>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { useMonteCarloStore } from '@/stores/monteCarlo'
import Logs from '@/components/Logs'
import LayoutWithSidebar from '@/layouts/LayoutWithSidebar'
import MultipleValuesTable from '@/components/MultipleValuesTable'
import { useMainStore } from '@/stores/main'
import { ClipboardIcon, CheckIcon } from '@heroicons/vue/solid'
import {
  LightningBoltIcon,
  PlusSmIcon,
  RefreshIcon,
  ReplyIcon,
  BanIcon,
  ClockIcon
} from '@heroicons/vue/outline'
import SlideOver from '@/components/Functional/SlideOver'
import ToggleButton from '@/components/ToggleButton'
import helpers from '@/helpers'
import Divider from '@/components/Divider'
import NumberInput from '@/components/Functional/NumberInput'
import ScenarioChart from '@/components/MonteCarlo/ScenarioChart'

export default {
  name: 'MonteCarloTab',
  components: {
    LayoutWithSidebar,
    Logs,
    ToggleButton,
    MultipleValuesTable,
    ClipboardIcon,
    CheckIcon,
    SlideOver,
    LightningBoltIcon,
    PlusSmIcon,
    RefreshIcon,
    ReplyIcon,
    BanIcon,
    ClockIcon,
    Divider,
    NumberInput,
    ScenarioChart
  },
  props: {
    form: {
      type: Object,
      required: true
    },
    results: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      copiedLogsInfo: false,
    }
  },
  computed: {
    hasResults () {
      return this.results.metrics.length > 0
    },
    ...mapState(useMainStore, ['isInitiated', 'baseURL']),
    remainingTimeText () {
      return helpers.remainingTimeText(this.results.progressbar.estimated_remaining_seconds)
    }
  },
  watch: {
    form: {
      handler () {
        helpers.localStorageSet('monteCarloForm', this.form)
      },
      deep: true
    },
  },
  methods: {
    ...mapActions(useMonteCarloStore, ['addTab', 'startInNewTab', 'start', 'cancel', 'rerun', 'newSimulation']),
    copyInfoLogs () {
      const infoLogsToCopy = document.querySelector('#copy-info-logs')
      infoLogsToCopy.setAttribute('type', 'text')
      infoLogsToCopy.select()
      document.execCommand('copy')
      this.copiedLogsInfo = true

      infoLogsToCopy.setAttribute('type', 'hidden')
      window.getSelection().removeAllRanges()

      setTimeout(() => {
        this.copiedLogsInfo = false
      }, 3000)
    },
  },
}
</script>

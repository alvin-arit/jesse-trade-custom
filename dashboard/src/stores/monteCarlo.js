import { defineStore } from 'pinia'
import _ from 'lodash'
import helpers from '@/helpers'
import axios from '@/http'
import { useMainStore } from '@/stores/main'
import notifier from '../notifier'

let idCounter = 0

function newTab () {
  return _.cloneDeep({
    id: ++idCounter,
    name: 'Tab 0',
    form: helpers.getDefaultFromLocalStorage('monteCarloForm', {
      start_date: '2021-01-01',
      finish_date: '2021-06-01',
      debug_mode: false,
      routes: [],
      extra_routes: [],
      num_simulations: 100,
      initial_balance: 10000,
      spread: 0.005, // 0.5%
      slippage: 0.001, // 0.1%
      fee: 0.001, // 0.1%
      random_starting_equity: false,
      equity_variance: 0.1, // 10%
    }),
    results: {
      showResults: false,
      executing: false,
      logsModal: false,
      progressbar: {
        current: 0,
        estimated_remaining_seconds: 0
      },
      routes_info: [],
      metrics: [],
      scenarios: [],
      generalInfo: {},
      infoLogs: '',
      exception: {
        error: '',
        traceback: ''
      },
      charts: {
        equity_curves: []
      },
      alert: {
        message: '',
        type: ''
      },
      statistics: {
        median_return: 0,
        worst_case_return: 0,
        best_case_return: 0,
        median_max_drawdown: 0,
        worst_case_max_drawdown: 0,
        probability_of_profit: 0,
        probability_of_ruin: 0,
        var_95: 0,
        cvar_95: 0
      }
    }
  })
}

export const useMonteCarloStore = defineStore({
  id: 'monteCarlo',
  state: () => ({
    tabs: {
      1: newTab()
    }
  }),
  actions: {
    addTab () {
      const tab = newTab()
      this.tabs[tab.id] = tab
      return this.$router.push(`/monte-carlo/${tab.id}`)
    },
    startInNewTab (id) {
      const tab = newTab()
      tab.form = _.cloneDeep(this.tabs[id].form)
      this.tabs[tab.id] = tab
      this.start(tab.id)
    },
    start (id) {
      this.tabs[id].results.progressbar.current = 0
      this.tabs[id].results.executing = true
      this.tabs[id].results.infoLogs = ''
      this.tabs[id].results.exception.traceback = ''
      this.tabs[id].results.exception.error = ''
      this.tabs[id].results.alert.message = ''
      this.tabs[id].results.metrics = []
      this.tabs[id].results.generalInfo = {}
      this.tabs[id].results.scenarios = []
      this.tabs[id].results.routes_info = []
      this.tabs[id].results.showResults = false
      this.tabs[id].results.charts.equity_curves = []

      const mainStore = useMainStore()

      // make sure symbols are uppercase
      this.tabs[id].form.routes = this.tabs[id].form.routes.map(route => {
        route.symbol = route.symbol.toUpperCase()
        return route
      })
      // also for extra_routes
      this.tabs[id].form.extra_routes = this.tabs[id].form.extra_routes.map(route => {
        route.symbol = route.symbol.toUpperCase()
        return route
      })

      const params = {
        id,
        routes: this.tabs[id].form.routes,
        extra_routes: this.tabs[id].form.extra_routes,
        config: mainStore.settings.backtest,
        start_date: this.tabs[id].form.start_date,
        finish_date: this.tabs[id].form.finish_date,
        debug_mode: this.tabs[id].form.debug_mode,
        num_simulations: this.tabs[id].form.num_simulations,
        initial_balance: this.tabs[id].form.initial_balance,
        spread: this.tabs[id].form.spread,
        slippage: this.tabs[id].form.slippage,
        fee: this.tabs[id].form.fee,
        random_starting_equity: this.tabs[id].form.random_starting_equity,
        equity_variance: this.tabs[id].form.equity_variance,
      }

      axios.post('/monte-carlo', params).catch(error => {
        notifier.error(`[${error.response.status}]: ${error.response.statusText}`)
        this.tabs[id].results.executing = false
      })
    },
    cancel (id) {
      if (this.tabs[id].results.exception.error) {
        this.tabs[id].results.executing = false
        return
      }
      axios.post('/monte-carlo/cancel', { id }).catch(error =>
        notifier.error(`[${error.response.status}]: ${error.response.statusText}`)
      )
    },
    terminate (id) {
      axios.post('/monte-carlo/terminate', { id }).catch(error =>
        notifier.error(`[${error.response.status}]: ${error.response.statusText}`)
      )
    },
    rerun (id) {
      this.tabs[id].results.showResults = false
      this.start(id)
    },
    newSimulation (id) {
      this.tabs[id].results.showResults = false
    },

    // WebSocket event handlers
    progressbarEvent (id, data) {
      this.tabs[id].results.progressbar = data
    },

    infoLogEvent (id, data) {
      this.tabs[id].results.infoLogs += `[${helpers.timestampToTime(
        data.timestamp
      )}] ${data.message}\n`
    },

    exceptionEvent (id, data) {
      this.tabs[id].results.exception.error = data.error
      this.tabs[id].results.exception.traceback = data.traceback
    },

    generalInfoEvent (id, data) {
      if (!this.tabs[id].results.executing) {
        this.tabs[id].results.executing = true
      }
      this.tabs[id].results.generalInfo = data
    },

    routesInfoEvent (id, data) {
      const arr = [['Exchange', 'Symbol', 'Timeframe', 'Strategy']]
      data.forEach(item => {
        arr.push([
          { value: item.exchange, style: '' },
          { value: item.symbol, style: '' },
          { value: item.timeframe, style: '' },
          { value: item.strategy_name, style: '' },
        ])
      })
      this.tabs[id].results.routes_info = arr
    },

    metricsEvent (id, data) {
      if (data === null) {
        this.tabs[id].results.metrics = []
        return
      }

      this.tabs[id].results.metrics = [
        ['Simulations Completed', data.simulations_completed || data.total_simulations],
        ['Median Return', `${_.round(data.median_return, 2)}%`],
        ['Best Case Return', `${_.round(data.best_case_return, 2)}%`],
        ['Worst Case Return', `${_.round(data.worst_case_return, 2)}%`],
        ['Median Max Drawdown', `${_.round(data.median_max_drawdown, 2)}%`],
        ['Worst Case Max Drawdown', `${_.round(data.worst_case_max_drawdown, 2)}%`],
        ['Probability of Profit', `${_.round(data.probability_of_profit * 100, 2)}%`],
        ['Probability of Ruin', `${_.round(data.probability_of_ruin * 100, 2)}%`],
        ['VaR (95%)', `${_.round(data.var_95, 2)}%`],
        ['CVaR (95%)', `${_.round(data.cvar_95, 2)}%`],
      ]

      this.tabs[id].results.statistics = data
    },

    equityCurvesEvent (id, data) {
      if (data === null) {
        this.tabs[id].results.charts.equity_curves = []
      } else {
        this.tabs[id].results.charts.equity_curves = data.map(curve => {
          return curve.map(point => ({
            value: point.balance,
            time: point.timestamp
          }))
        })
      }

      // Monte Carlo simulation is finished
      this.tabs[id].results.executing = false
      this.tabs[id].results.showResults = true
    },

    scenariosEvent (id, data) {
      this.tabs[id].results.scenarios = data
    },

    terminationEvent (id) {
      if (this.tabs[id].results.executing) {
        this.tabs[id].results.executing = false
        notifier.success('Simulation terminated successfully')
      }
    },

    alertEvent (id, data) {
      this.tabs[id].results.alert = data
      this.tabs[id].results.executing = false
      this.tabs[id].results.showResults = true
    },
  }
})

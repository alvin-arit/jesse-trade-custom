import { defineStore } from 'pinia'
import _ from 'lodash'
import helpers from '@/helpers'
import axios from '@/http'
import { useMainStore } from '@/stores/main'
import notifier from '../notifier'

let idCounter = 0

// Generate a UUID v4
function generateUUID () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * A function that returns required data for a new tab
 */
function newTab () {
  return _.cloneDeep({
    id: ++idCounter,
    name: 'Tab 0',
    form: helpers.getDefaultFromLocalStorage('backtestForm', {
      start_date: '2021-01-01',
      finish_date: '2021-06-01',
      debug_mode: false,
      export_tradingview: false,
      export_full_reports: false,
      export_csv: false,
      export_json: false,
      routes: [],
      extra_routes: []
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
      hyperparameters: [],
      generalInfo: {},
      infoLogs: '',
      exception: {
        error: '',
        traceback: ''
      },
      trades: [],
      charts: {
        equity_curve: [],
        candles: [],
        orders: [],
        lines: [],
        shapes: [],
        extraLines: [],
        horizontalLines: [],
        extraHorizontalLines: []
      },
      alert: {
        message: '',
        type: ''
      }
    }
  })
}

export const useBacktestStore = defineStore({
  id: 'backtest',
  state: () => ({
    tabs: {
      1: newTab()
    }
  }),
  actions: {
    addTab () {
      const tab = newTab()
      this.tabs[tab.id] = tab
      return this.$router.push(`/backtest/${tab.id}`)
    },
    startInNewTab (id) {
      const tab = newTab()
      tab.form = _.cloneDeep(this.tabs[id].form)
      this.tabs[tab.id] = tab
      this.start(tab.id)
    },
    start (id) {
      // Generate a UUID for this session
      const sessionId = generateUUID()
      this.tabs[id].sessionId = sessionId
      console.log('[Backtest] Starting session with UUID:', sessionId, 'for tab:', id)

      this.tabs[id].results.progressbar.current = 0
      this.tabs[id].results.executing = true
      this.tabs[id].results.infoLogs = ''
      this.tabs[id].results.exception.traceback = ''
      this.tabs[id].results.exception.error = ''
      this.tabs[id].results.alert.message = ''

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

      // Get exchange from the first route
      const exchange = this.tabs[id].form.routes.length > 0
        ? this.tabs[id].form.routes[0].exchange
        : ''

      axios.post('/backtest', {
        id: sessionId,
        exchange,
        routes: this.tabs[id].form.routes,
        data_routes: this.tabs[id].form.extra_routes,
        config: mainStore.settings.backtest,
        start_date: this.tabs[id].form.start_date,
        finish_date: this.tabs[id].form.finish_date,
        debug_mode: this.tabs[id].form.debug_mode,
        export_csv: this.tabs[id].form.export_csv,
        export_chart: true, // Always export chart data
        export_tradingview: this.tabs[id].form.export_tradingview,
        export_json: this.tabs[id].form.export_json,
        fast_mode: false,
        benchmark: false
      }).catch(error => {
        notifier.error(`[${error.response.status}]: ${error.response.statusText}`)
        this.tabs[id].results.executing = false
      })
    },
    cancel (id) {
      if (this.tabs[id].results.exception.error) {
        this.tabs[id].results.executing = false
        return
      }

      const sessionId = this.tabs[id].sessionId
      if (!sessionId) {
        this.tabs[id].results.executing = false
        return
      }

      axios.delete('/backtest', {
        headers: {},
        data: {
          id: sessionId
        }
      }).then(() => {
        // this is for passing cypress tests
        if (window.Cypress) {
          this.tabs[id].results.executing = false
        }
      }).catch(error => notifier.error(`[${error.response.status}]: ${error.response.statusText}`))
    },
    rerun (id) {
      this.tabs[id].results.showResults = false
      this.start(id)
    },
    newBacktest (id) {
      this.tabs[id].results.showResults = false
    },

    // Find tab by session UUID
    getTabBySessionId (sessionId) {
      console.log('[Backtest] Looking for tab with sessionId:', sessionId)
      console.log('[Backtest] Available tabs:', Object.keys(this.tabs).map(k => ({ tabId: k, sessionId: this.tabs[k].sessionId })))
      for (const tabId in this.tabs) {
        if (this.tabs[tabId].sessionId === sessionId) {
          console.log('[Backtest] Found tab:', tabId)
          return this.tabs[tabId]
        }
      }
      console.log('[Backtest] No tab found for sessionId:', sessionId)
      return null
    },

    // Find tab ID by session UUID
    getTabIdBySessionId (sessionId) {
      for (const tabId in this.tabs) {
        if (this.tabs[tabId].sessionId === sessionId) {
          return tabId
        }
      }
      return null
    },

    candlesInfoEvent (sessionId, data) {
      const tab = this.getTabBySessionId(sessionId)
      if (!tab) return
      const list = [
        ['Period', data.duration],
        ['Starting Date', helpers.timestampToDate(
          data.starting_time
        )],
        ['Ending Date', helpers.timestampToDate(data.finishing_time)],
        ['Exchange Type', data.exchange_type],
      ]
      if (data.exchange_type === 'futures') {
        list.push(['Leverage', data.leverage])
        list.push(['Leverage Mode', data.leverage_mode])
      }
      tab.results.info = list
    },
    routesInfoEvent (sessionId, data) {
      const tab = this.getTabBySessionId(sessionId)
      if (!tab) return
      const arr = [['Exchange', 'Symbol', 'Timeframe', 'Strategy']]
      data.forEach(item => {
        arr.push([
          { value: item.exchange, style: '' },
          { value: item.symbol, style: '' },
          { value: item.timeframe, style: '' },
          { value: item.strategy_name, style: '' },
        ])
      })
      tab.results.routes_info = arr
    },
    progressbarEvent (sessionId, data) {
      const tab = this.getTabBySessionId(sessionId)
      if (!tab) return
      tab.results.progressbar = data
    },
    infoLogEvent (sessionId, data) {
      const tab = this.getTabBySessionId(sessionId)
      if (!tab) return
      tab.results.infoLogs += `[${helpers.timestampToTime(
        data.timestamp
      )}] ${data.message}\n`
    },
    exceptionEvent (sessionId, data) {
      const tab = this.getTabBySessionId(sessionId)
      if (!tab) return
      tab.results.exception.error = data.error
      tab.results.exception.traceback = data.traceback
    },
    generalInfoEvent (sessionId, data) {
      const tab = this.getTabBySessionId(sessionId)
      if (!tab) return
      tab.results.generalInfo = data
    },
    hyperparametersEvent (sessionId, data) {
      const tab = this.getTabBySessionId(sessionId)
      if (!tab) return
      tab.results.hyperparameters = data
    },
    metricsEvent (sessionId, data) {
      console.log('[Backtest] metricsEvent received:', { sessionId, dataExists: !!data })
      const tab = this.getTabBySessionId(sessionId)
      if (!tab) {
        console.log('[Backtest] metricsEvent: No tab found, ignoring')
        return
      }
      // no trades were executed
      if (data === null) {
        console.log('[Backtest] metricsEvent: No data (null)')
        tab.results.metrics = []
        return
      }
      console.log('[Backtest] metricsEvent: Processing metrics')

      tab.results.metrics = [
        ['Total Closed Trades', data.total],
        ['Total Net Profit', `${_.round(data.net_profit, 2)} (${_.round(data.net_profit_percentage, 2)}%)`],
        ['Starting => Finishing Balance', `${_.round(data.starting_balance, 2)} => ${_.round(data.finishing_balance, 2)}`],
        ['Open Trades', data.total_open_trades],
        // ['Open Trade\' PNL', data.open_pl],
        ['Total Paid Fees', _.round(data.fee, 2)],
        ['Max Drawdown', `${_.round(data.max_drawdown, 2)}%`],
        ['Annual Return', `${_.round(data.annual_return, 2)}%`],
        ['Expectancy', `${_.round(data.expectancy, 2)} (${_.round(data.expectancy_percentage, 2)}%)`],
        ['Avg Win | Avg Loss', `${_.round(data.average_win, 2)} | ${_.round(data.average_loss, 2)}`],
        ['Ratio Avg Win / Avg Loss', _.round(data.ratio_avg_win_loss, 2)],
        ['Win-rate', `${_.round(data.win_rate * 100, 2)}%`],
        ['Longs | Shorts', `${_.round(data.longs_percentage, 2)}% | ${_.round(data.shorts_percentage, 2)}%`],
        ['Avg Holding Time', helpers.secondsToHumanReadable(data.average_holding_period)],
        ['Winning Trades Avg Holding Time', helpers.secondsToHumanReadable(data.average_winning_holding_period)],
        ['Losing Trades Avg Holding Time', helpers.secondsToHumanReadable(data.average_losing_holding_period)],
        ['Sharpe Ratio', _.round(data.sharpe_ratio, 2)],
        ['Calmar Ratio', _.round(data.calmar_ratio, 2)],
        ['Sortino Ratio', _.round(data.sortino_ratio, 2)],
        ['Omega Ratio', _.round(data.omega_ratio, 2)],
        ['Winning Streak', data.winning_streak],
        ['Losing Streak', data.losing_streak],
        ['Largest Winning Trade', _.round(data.largest_winning_trade, 2)],
        ['Largest Losing Trade', _.round(data.largest_losing_trade, 2)],
        ['Total Winning Trades', data.total_winning_trades],
        ['Total Losing Trades', data.total_losing_trades]
      ]
    },
    equityCurveEvent (sessionId, data) {
      console.log('[Backtest] equityCurveEvent received:', { sessionId, data })
      const tab = this.getTabBySessionId(sessionId)
      if (!tab) {
        console.log('[Backtest] equityCurveEvent: No tab found, ignoring')
        return
      }
      // no trades were executed or invalid data
      if (!data || (Array.isArray(data) && data.length === 0)) {
        console.log('[Backtest] equityCurveEvent: No data or empty array')
        tab.results.charts.equity_curve = []
      } else {
        console.log('[Backtest] equityCurveEvent: Processing data')
        tab.results.charts.equity_curve = []
        // Backend sends: [{name: 'Portfolio', data: [{time, value, color}, ...], color}, ...]
        // We need to extract the first series (Portfolio) data points
        if (Array.isArray(data) && data.length > 0 && data[0].data) {
          // New format: array of series objects
          const portfolioSeries = data[0] // Get the Portfolio series
          if (portfolioSeries.data && Array.isArray(portfolioSeries.data)) {
            portfolioSeries.data.forEach(item => {
              tab.results.charts.equity_curve.push({
                value: item.value,
                time: item.time
              })
            })
          }
        } else if (Array.isArray(data)) {
          // Old format: flat array of {balance, timestamp}
          data.forEach(item => {
            tab.results.charts.equity_curve.push({
              value: item.balance || item.value,
              time: item.timestamp || item.time
            })
          })
        }
      }

      // backtest is finished, time to show charts:
      tab.results.executing = false
      tab.results.showResults = true

      // Always fetch chart data for the interactive chart
      const tabId = this.getTabIdBySessionId(sessionId)
      if (tabId) {
        console.log('[Backtest] Fetching chart data for completed backtest')
        this.fetchChartData(tabId)
      }
    },
    terminationEvent (sessionId) {
      const tab = this.getTabBySessionId(sessionId)
      if (!tab) return
      if (tab.results.executing) {
        tab.results.executing = false
        notifier.success('Session terminated successfully')
      }
    },
    alertEvent (sessionId, data) {
      const tab = this.getTabBySessionId(sessionId)
      if (!tab) return
      tab.results.alert = data
    },
    tradesEvent (sessionId, data) {
      const tab = this.getTabBySessionId(sessionId)
      if (!tab) return
      tab.results.trades = data || []
    },

    async fetchChartData (tabId) {
      const tab = this.tabs[tabId]
      if (!tab || !tab.results.generalInfo.session_id) {
        console.log('[Backtest] fetchChartData: No session ID available')
        return
      }

      const sessionId = tab.results.generalInfo.session_id
      console.log('[Backtest] Fetching chart data for session:', sessionId)

      try {
        const res = await axios.post(`/backtest/sessions/${sessionId}/chart-data`)
        const chartData = res.data.chart_data

        if (chartData) {
          console.log('[Backtest] Chart data received:', Object.keys(chartData))
          tab.results.charts.candles = chartData.candles_chart || []
          tab.results.charts.orders = chartData.orders_chart || []
          tab.results.charts.lines = chartData.add_line_to_candle_chart || []
          tab.results.charts.shapes = chartData.add_shape_to_candle_chart || []
          tab.results.charts.extraLines = chartData.add_extra_line_chart || []
          tab.results.charts.horizontalLines = chartData.add_horizontal_line_to_candle_chart || []
          tab.results.charts.extraHorizontalLines = chartData.add_horizontal_line_to_extra_chart || []
        } else {
          console.log('[Backtest] No chart data available')
        }
      } catch (error) {
        console.error('[Backtest] Failed to fetch chart data:', error)
        notifier.error('Failed to fetch chart data')
      }
    },
  }
})

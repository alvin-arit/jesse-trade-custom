import { createRouter, createWebHashHistory } from 'vue-router'
import { useMainStore } from '@/stores/main'

// Views
import Candles from '@/views/Candles'
import Backtest from '@/views/Backtest'
import Test from '@/views/Test' // For debug purpose
import Live from '@/views/Live'
import Optimization from '@/views/Optimization'
import BacktestHistory from '@/views/BacktestHistory'
import OptimizationHistory from '@/views/OptimizationHistory'
import MonteCarlo from '@/views/MonteCarlo'
import MonteCarloHistory from '@/views/MonteCarloHistory'
import Strategies from '@/views/Strategies'
import StrategyBrowser from '@/views/StrategyBrowser'
import LiveHistory from '@/views/LiveHistory'

import { watch } from 'vue'
import Home from '@/views/Home'

// Check whether socket is connected or not
const isSocketConnected = (to, from, next) => {
  const store = useMainStore()

  if (store.isConnected) {
    next()
  } else {
    const unwatch = watch(store,
      (state) => {
        if (state.isConnected) {
          unwatch()
          next()
        }
      },
      { deep: true }
    )
  }
}

const routes = [
  { path: '/backtest', redirect: '/backtest/1' },
  { path: '/candles', redirect: '/candles/1' },
  { path: '/live', redirect: '/live/1' },
  { path: '/optimization', redirect: '/optimization/1' },
  { path: '/monte-carlo', redirect: '/monte-carlo/1' },
  {
    path: '/',
    component: Home,
    name: 'Home',
    beforeEnter: isSocketConnected,
  },
  {
    path: '/candles/:id',
    component: Candles,
    name: 'Candles',
    beforeEnter: isSocketConnected,
  },
  {
    path: '/backtest/:id',
    component: Backtest,
    name: 'Backtest',
    beforeEnter: isSocketConnected,
  },
  {
    path: '/live/:id',
    component: Live,
    name: 'Live',
    beforeEnter: isSocketConnected,
  },
  {
    path: '/optimization/:id',
    component: Optimization,
    name: 'Optimization',
    beforeEnter: isSocketConnected,
  },
  {
    path: '/test',
    component: Test,
    name: 'Test',
    beforeEnter: isSocketConnected,
  },
  {
    path: '/backtest-history',
    component: BacktestHistory,
    name: 'BacktestHistory',
    beforeEnter: isSocketConnected,
  },
  {
    path: '/optimization-history',
    component: OptimizationHistory,
    name: 'OptimizationHistory',
    beforeEnter: isSocketConnected,
  },
  {
    path: '/monte-carlo/:id',
    component: MonteCarlo,
    name: 'MonteCarlo',
    beforeEnter: isSocketConnected,
  },
  {
    path: '/monte-carlo-history',
    component: MonteCarloHistory,
    name: 'MonteCarloHistory',
    beforeEnter: isSocketConnected,
  },
  {
    path: '/strategies',
    component: Strategies,
    name: 'Strategies',
    beforeEnter: isSocketConnected,
  },
  {
    path: '/strategy-browser',
    component: StrategyBrowser,
    name: 'StrategyBrowser',
    beforeEnter: isSocketConnected,
  },
  {
    path: '/live-history',
    component: LiveHistory,
    name: 'LiveHistory',
    beforeEnter: isSocketConnected,
  },
]

const router = createRouter({
  history: createWebHashHistory(process.env.BASE_URL),
  mode: 'hash',
  routes
})

export default router

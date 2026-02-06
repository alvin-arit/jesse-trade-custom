<template>
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead class="bg-gray-50 dark:bg-gray-800">
        <tr>
          <th
            scope="col"
            class="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
            @click="toggleSort('number')"
          >
            <span class="flex items-center gap-1">
              #
              <SortIcon :active="sortColumn === 'number'" :direction="sortDirection" />
            </span>
          </th>
          <th scope="col" class="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Side
          </th>
          <th scope="col" class="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Entry Time
          </th>
          <th scope="col" class="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Entry Price
          </th>
          <th scope="col" class="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Exit Time
          </th>
          <th scope="col" class="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Exit Price
          </th>
          <th
            scope="col"
            class="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
            @click="toggleSort('pnl')"
          >
            <span class="flex items-center justify-end gap-1">
              PnL
              <SortIcon :active="sortColumn === 'pnl'" :direction="sortDirection" />
            </span>
          </th>
          <th scope="col" class="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            PnL%
          </th>
          <th
            scope="col"
            class="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
            @click="toggleSort('duration')"
          >
            <span class="flex items-center gap-1">
              Duration
              <SortIcon :active="sortColumn === 'duration'" :direction="sortDirection" />
            </span>
          </th>
        </tr>
      </thead>
      <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
        <tr
          v-for="trade in sortedTrades"
          :key="trade.number"
          class="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150"
          @click="$emit('trade-click', trade)"
        >
          <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
            {{ trade.number }}
          </td>
          <td class="px-3 py-2 whitespace-nowrap text-sm font-medium" :class="sideColor(trade.side)">
            {{ trade.side }}
          </td>
          <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
            {{ trade.entryTime }}
          </td>
          <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right">
            {{ trade.entryPrice }}
          </td>
          <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
            {{ trade.exitTime }}
          </td>
          <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right">
            {{ trade.exitPrice }}
          </td>
          <td class="px-3 py-2 whitespace-nowrap text-sm font-medium text-right" :class="pnlColor(trade.rawPnl)">
            {{ trade.pnl }}
          </td>
          <td class="px-3 py-2 whitespace-nowrap text-sm font-medium text-right" :class="pnlColor(trade.rawPnl)">
            {{ trade.pnlPercent }}%
          </td>
          <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
            {{ trade.duration }}
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="!trades.length" class="text-center py-8 text-gray-500 dark:text-gray-400">
      No trades to display
    </div>
  </div>
</template>

<script>
import helpers from '@/helpers'

const SortIcon = {
  name: 'SortIcon',
  props: {
    active: Boolean,
    direction: String
  },
  template: `
    <svg class="w-3 h-3" :class="active ? 'text-indigo-500' : 'text-gray-400'" viewBox="0 0 10 14" fill="currentColor">
      <path v-if="!active || direction === 'asc'" d="M5 0L9.33 5H0.67L5 0Z" :opacity="active && direction === 'asc' ? 1 : 0.4" />
      <path v-if="!active || direction === 'desc'" d="M5 14L0.67 9H9.33L5 14Z" :opacity="active && direction === 'desc' ? 1 : 0.4" />
    </svg>
  `
}

export default {
  name: 'TradeListTable',
  components: {
    SortIcon
  },
  props: {
    trades: {
      type: Array,
      default: () => []
    }
  },
  emits: ['trade-click'],
  data () {
    return {
      sortColumn: null,
      sortDirection: 'asc'
    }
  },
  computed: {
    formattedTrades () {
      return this.trades.map((trade, index) => ({
        number: index + 1,
        side: trade.type?.toUpperCase() || 'N/A',
        entryTime: this.formatTimestamp(trade.opened_at),
        entryPrice: this.formatPrice(trade.entry_price),
        exitTime: this.formatTimestamp(trade.closed_at),
        exitPrice: this.formatPrice(trade.exit_price),
        pnl: this.formatPnl(trade.PNL),
        pnlPercent: this.formatPnlPercent(trade.PNL_percentage),
        duration: this.formatDuration(trade.holding_period),
        rawPnl: trade.PNL || 0,
        rawDuration: trade.holding_period || 0,
        rawEntryTime: Math.floor(trade.opened_at / 1000),
        rawExitTime: Math.floor(trade.closed_at / 1000),
        type: trade.type
      }))
    },
    sortedTrades () {
      if (!this.sortColumn) {
        return this.formattedTrades
      }

      const sorted = [...this.formattedTrades]
      const direction = this.sortDirection === 'asc' ? 1 : -1

      sorted.sort((a, b) => {
        let valA, valB

        switch (this.sortColumn) {
          case 'number':
            valA = a.number
            valB = b.number
            break
          case 'pnl':
            valA = a.rawPnl
            valB = b.rawPnl
            break
          case 'duration':
            valA = a.rawDuration
            valB = b.rawDuration
            break
          default:
            return 0
        }

        if (valA < valB) return -1 * direction
        if (valA > valB) return 1 * direction
        return 0
      })

      return sorted
    }
  },
  methods: {
    toggleSort (column) {
      if (this.sortColumn === column) {
        // Toggle direction or reset
        if (this.sortDirection === 'asc') {
          this.sortDirection = 'desc'
        } else {
          // Reset sorting
          this.sortColumn = null
          this.sortDirection = 'asc'
        }
      } else {
        // New column, start with ascending
        this.sortColumn = column
        this.sortDirection = 'asc'
      }
    },
    formatTimestamp (timestamp) {
      if (!timestamp) return 'N/A'
      return helpers.timestampToTime(timestamp)
    },
    formatPrice (price) {
      if (price == null) return 'N/A'
      return helpers.roundPrice(price).toLocaleString()
    },
    formatPnl (pnl) {
      if (pnl == null) return 'N/A'
      const value = pnl.toFixed(2)
      return pnl >= 0 ? `+${value}` : value
    },
    formatPnlPercent (pnlPercent) {
      if (pnlPercent == null) return 'N/A'
      const value = pnlPercent.toFixed(2)
      return pnlPercent >= 0 ? `+${value}` : value
    },
    formatDuration (seconds) {
      if (!seconds) return 'N/A'
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      if (hours > 0) {
        return `${hours}h ${minutes}m`
      }
      return `${minutes}m`
    },
    sideColor (side) {
      return side === 'LONG'
        ? 'text-green-600 dark:text-green-400'
        : 'text-red-500 dark:text-red-400'
    },
    pnlColor (pnl) {
      if (pnl > 0) return 'text-green-600 dark:text-green-400'
      if (pnl < 0) return 'text-red-500 dark:text-red-400'
      return 'text-gray-900 dark:text-gray-200'
    }
  }
}
</script>

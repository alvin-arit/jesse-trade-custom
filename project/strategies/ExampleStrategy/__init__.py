from jesse.strategies import Strategy, cached
import jesse.indicators as ta
from jesse import utils
import numpy as np


class ExampleStrategy(Strategy):
    """
    EMA Crossover Strategy with Fair Value Gap (FVG) Detection

    - Uses two EMAs (fast and slow) for trend direction
    - Detects and tracks Fair Value Gaps (FVGs)
    - FVGs become invalid when:
      1. The trend changes (EMA crossover)
      2. A candle fully closes on the other side of the FVG
    - Draws EMAs as trendlines and FVGs as boxes on the chart
    """

    def __init__(self):
        super().__init__()
        # Store active FVGs: {'type': 'bullish'/'bearish', 'top': price, 'bottom': price, 'start_time': timestamp, 'valid': True}
        self.active_fvgs = []
        # Store previous trend for detecting trend changes
        self.prev_trend = None

    @property
    def fast_ema_period(self):
        return 9

    @property
    def slow_ema_period(self):
        return 21

    @property
    @cached
    def fast_ema(self):
        return ta.ema(self.candles, period=self.fast_ema_period)

    @property
    @cached
    def slow_ema(self):
        return ta.ema(self.candles, period=self.slow_ema_period)

    @property
    def trend(self):
        """Returns 'bullish' if fast EMA > slow EMA, 'bearish' otherwise"""
        if self.fast_ema > self.slow_ema:
            return 'bullish'
        return 'bearish'

    @property
    def trend_changed(self):
        """Detects if trend just changed"""
        if self.prev_trend is None:
            return False
        return self.prev_trend != self.trend

    def detect_fvg(self):
        """
        Detect Fair Value Gap (FVG) on the current candle

        Bullish FVG: Gap between candle[2].high and candle[0].low (3 candles ago high < current low)
        Bearish FVG: Gap between candle[2].low and candle[0].high (3 candles ago low > current high)

        Returns: dict with FVG info or None
        """
        if len(self.candles) < 3:
            return None

        # Get the last 3 candles (index -3, -2, -1 or using candles array)
        candle_0 = self.candles[-1]  # Current candle
        candle_1 = self.candles[-2]  # Previous candle (middle)
        candle_2 = self.candles[-3]  # 2 candles ago

        # Candle format: [timestamp, open, close, high, low, volume]
        high_idx = 3
        low_idx = 4
        timestamp_idx = 0

        # Bullish FVG: candle_2's high is lower than candle_0's low (gap up)
        if candle_2[high_idx] < candle_0[low_idx]:
            return {
                'type': 'bullish',
                'top': candle_0[low_idx],
                'bottom': candle_2[high_idx],
                'start_time': int(candle_1[timestamp_idx]),
                'valid': True
            }

        # Bearish FVG: candle_2's low is higher than candle_0's high (gap down)
        if candle_2[low_idx] > candle_0[high_idx]:
            return {
                'type': 'bearish',
                'top': candle_2[low_idx],
                'bottom': candle_0[high_idx],
                'start_time': int(candle_1[timestamp_idx]),
                'valid': True
            }

        return None

    def invalidate_fvgs(self):
        """
        Invalidate FVGs based on:
        1. Trend change (EMA crossover)
        2. Candle fully closing on the other side of the FVG
        """
        current_candle = self.candles[-1]
        close_price = current_candle[2]  # close is index 2

        for fvg in self.active_fvgs:
            if not fvg['valid']:
                continue

            # Invalidate on trend change
            if self.trend_changed:
                # Invalidate FVGs that don't match the new trend
                if fvg['type'] == 'bullish' and self.trend == 'bearish':
                    fvg['valid'] = False
                    fvg['end_time'] = int(current_candle[0])
                elif fvg['type'] == 'bearish' and self.trend == 'bullish':
                    fvg['valid'] = False
                    fvg['end_time'] = int(current_candle[0])

            # Invalidate when candle fully closes on the other side
            if fvg['valid']:
                if fvg['type'] == 'bullish':
                    # Bullish FVG invalid if price closes below the bottom
                    if close_price < fvg['bottom']:
                        fvg['valid'] = False
                        fvg['end_time'] = int(current_candle[0])
                elif fvg['type'] == 'bearish':
                    # Bearish FVG invalid if price closes above the top
                    if close_price > fvg['top']:
                        fvg['valid'] = False
                        fvg['end_time'] = int(current_candle[0])

    def before(self):
        """Called before each candle"""
        # Invalidate FVGs first
        self.invalidate_fvgs()

        # Detect new FVG
        new_fvg = self.detect_fvg()
        if new_fvg:
            # Only add FVG if it matches the current trend
            if (new_fvg['type'] == 'bullish' and self.trend == 'bullish') or \
               (new_fvg['type'] == 'bearish' and self.trend == 'bearish'):
                self.active_fvgs.append(new_fvg)

        # Clean up old invalid FVGs (keep last 50 for drawing)
        if len(self.active_fvgs) > 100:
            self.active_fvgs = self.active_fvgs[-50:]

    def after(self):
        """Called after each candle - update previous trend"""
        self.prev_trend = self.trend

    def should_long(self) -> bool:
        # Go long when in bullish trend
        return self.trend == 'bullish'

    def should_short(self) -> bool:
        # Go short when in bearish trend
        return self.trend == 'bearish'

    def should_cancel_entry(self) -> bool:
        return False

    def go_long(self):
        # Enter long with 5% of capital
        qty = utils.size_to_qty(self.balance * 0.05, self.price)
        self.buy = qty, self.price

    def go_short(self):
        # Enter short with 5% of capital
        qty = utils.size_to_qty(self.balance * 0.05, self.price)
        self.sell = qty, self.price

    def update_position(self):
        # Close long if trend turns bearish
        if self.is_long and self.trend == 'bearish':
            self.liquidate()

        # Close short if trend turns bullish
        if self.is_short and self.trend == 'bullish':
            self.liquidate()

    def watch_list(self):
        """
        Return values to display in the watch list during live trading
        """
        return [
            ('Fast EMA', self.fast_ema),
            ('Slow EMA', self.slow_ema),
            ('Trend', self.trend),
            ('Active FVGs', len([f for f in self.active_fvgs if f['valid']])),
        ]

    def draw_lines(self):
        """
        Draw EMA lines on the chart
        Returns a list of line data for the chart
        """
        # Get all candles for drawing full EMA lines
        candles = self.candles

        # Calculate EMAs for all candles
        fast_ema_values = ta.ema(candles, period=self.fast_ema_period, sequential=True)
        slow_ema_values = ta.ema(candles, period=self.slow_ema_period, sequential=True)

        lines = []

        # Fast EMA line (blue)
        fast_ema_data = []
        for i in range(len(candles)):
            if not np.isnan(fast_ema_values[i]):
                fast_ema_data.append({
                    'time': int(candles[i][0] / 1000),  # Convert to seconds
                    'value': float(fast_ema_values[i])
                })

        if fast_ema_data:
            lines.append({
                'name': f'EMA {self.fast_ema_period}',
                'data': fast_ema_data,
                'color': '#2196F3'  # Blue
            })

        # Slow EMA line (orange)
        slow_ema_data = []
        for i in range(len(candles)):
            if not np.isnan(slow_ema_values[i]):
                slow_ema_data.append({
                    'time': int(candles[i][0] / 1000),  # Convert to seconds
                    'value': float(slow_ema_values[i])
                })

        if slow_ema_data:
            lines.append({
                'name': f'EMA {self.slow_ema_period}',
                'data': slow_ema_data,
                'color': '#FF9800'  # Orange
            })

        return lines

    def draw_shapes(self):
        """
        Draw FVG boxes on the chart
        Returns a list of shape data for the chart
        """
        shapes = []
        current_time = int(self.candles[-1][0] / 1000) if len(self.candles) > 0 else 0

        for fvg in self.active_fvgs:
            # Determine end time - either when invalidated or current time
            end_time = fvg.get('end_time', current_time * 1000)
            if isinstance(end_time, int) and end_time > 1000000000000:
                end_time = int(end_time / 1000)
            elif not fvg['valid']:
                end_time = int(end_time / 1000) if end_time > 1000000000000 else end_time
            else:
                end_time = current_time

            start_time = int(fvg['start_time'] / 1000) if fvg['start_time'] > 1000000000000 else fvg['start_time']

            # Color based on type and validity
            if fvg['type'] == 'bullish':
                color = 'rgba(38, 166, 154, 0.3)' if fvg['valid'] else 'rgba(38, 166, 154, 0.1)'
                border_color = '#26a69a'
            else:
                color = 'rgba(239, 83, 80, 0.3)' if fvg['valid'] else 'rgba(239, 83, 80, 0.1)'
                border_color = '#ef5350'

            shapes.append({
                'type': 'rectangle',
                'start_time': start_time,
                'end_time': end_time,
                'top': fvg['top'],
                'bottom': fvg['bottom'],
                'color': color,
                'border_color': border_color,
                'fvg_type': fvg['type'],
                'valid': fvg['valid']
            })

        return shapes

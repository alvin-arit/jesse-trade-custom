import os
import time
import uuid
from datetime import datetime

import psycopg2
import requests
from dotenv import load_dotenv

# ==================== CONFIGURATION ====================
# Load .env from parent dir (assuming script in utils/)
ENV_PATH = os.path.join(os.path.dirname(__file__), '../project/.env')
# If wrong, use absolute: ENV_PATH = '/home/admin/.openclaw/workspace/projects/ledg-backtest/.env'

if load_dotenv(ENV_PATH):
    print(f"Loaded .env from → {ENV_PATH}\n")
else:
    print(f"Failed to load .env from {ENV_PATH} - check path!\n")

# ==================== MAIN FUNCTION ====================
def date_to_millis(date_str: str) -> int:
    dt = datetime.strptime(date_str, '%Y-%m-%d')
    return int(dt.timestamp() * 1000)

def fetch_klines(symbol: str, start_time: int, limit: int = 1000):
    url = "https://api.binance.com/api/v3/klines"
    params = {
        "symbol": symbol.replace("-", ""),
        "interval": "1m",
        "startTime": start_time,
        "limit": limit
    }
    r = requests.get(url, params=params)
    if r.status_code != 200:
        raise Exception(f"Binance API Error: {r.text}")
    return r.json()

def insert_candles(candles: list, exchange: str, symbol: str):
    try:
        conn = psycopg2.connect(
            dbname=os.getenv("POSTGRES_NAME"),
            user=os.getenv("POSTGRES_USERNAME"),
            password=os.getenv("POSTGRES_PASSWORD"),
            host=os.getenv("POSTGRES_HOST"),
            port=os.getenv("POSTGRES_PORT")
        )
        cur = conn.cursor()

        for c in candles:
            cur.execute("""
                INSERT INTO candle 
                (id, timestamp, open, high, low, close, volume, exchange, symbol, timeframe)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (exchange, symbol, timeframe, timestamp) DO NOTHING
            """, (
                str(uuid.uuid4()),
                c[0],                    # timestamp
                float(c[1]),             # open
                float(c[2]),             # high
                float(c[3]),             # low
                float(c[4]),             # close
                float(c[5]),             # volume
                exchange,
                symbol,
                "1m"
            ))

        conn.commit()
        cur.close()
        conn.close()
        print(f"→ Inserted {len(candles)} candles")
    except psycopg2.Error as e:
        print(f"DB Error: {e}")

# ==================== RUN ====================
if __name__ == "__main__":
    exchange = "Binance"
    symbol = "BTC-USDT"
    start_date = "2026-01-01"          # Change this as needed

    start_time = date_to_millis(start_date)

    print(f"Starting import from {start_date} for {symbol}...\n")

    while True:
        try:
            data = fetch_klines(symbol, start_time)
            if len(data) <= 1:
                print("Import finished!")
                break

            insert_candles(data, exchange, symbol)
            start_time = data[-1][6] + 1          # next batch starts after last candle
            time.sleep(0.25)   # Be gentle with Binance rate limits
        except Exception as e:
            print(f"Error: {e}")
            time.sleep(5)  # Retry delay

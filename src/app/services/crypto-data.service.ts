import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { CandleData, TradingPair } from '../models/trading.models';

@Injectable({
  providedIn: 'root'
})
export class CryptoDataService {
  private readonly BINANCE_API = 'https://api.binance.com/api/v3';
  private currentPairSubject = new BehaviorSubject<TradingPair>({
    symbol: 'BTCUSDT',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    displayName: 'BTC/USDT'
  });

  // Pares de trading predefinidos
  readonly DEFAULT_PAIRS: TradingPair[] = [
    { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', displayName: 'BTC/USDT' },
    { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', displayName: 'ETH/USDT' },
    { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT', displayName: 'SOL/USDT' },
    { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT', displayName: 'BNB/USDT' },
    { symbol: 'LINKUSDT', baseAsset: 'LINK', quoteAsset: 'USDT', displayName: 'LINK/USDT' },
    { symbol: 'TRXUSDT', baseAsset: 'TRX', quoteAsset: 'USDT', displayName: 'TRX/USDT' }
  ];

  readonly TIMEFRAMES = [
    { value: '1m', label: '1m', minutes: 1 },
    { value: '5m', label: '5m', minutes: 5 },
    { value: '15m', label: '15m', minutes: 15 },
    { value: '30m', label: '30m', minutes: 30 },
    { value: '1h', label: '1h', minutes: 60 },
    { value: '4h', label: '4h', minutes: 240 },
    { value: '1d', label: '1d', minutes: 1440 },
    { value: '1w', label: '1w', minutes: 10080 }
  ];

  readonly REFRESH_INTERVALS = [
    { value: 5000, label: '5s' },
    { value: 10000, label: '10s' },
    { value: 30000, label: '30s' },
    { value: 60000, label: '60s' },
    { value: 0, label: 'Manual' }
  ];

  constructor(private http: HttpClient) {}

  setCurrentPair(pair: TradingPair): void {
    this.currentPairSubject.next(pair);
  }

  getCurrentPair(): Observable<TradingPair> {
    return this.currentPairSubject.asObservable();
  }

  /**
   * Obtiene datos de velas japonesas desde Binance API
   */
  getKlines(symbol: string, interval: string, limit: number = 500): Observable<CandleData[]> {
    const url = `${this.BINANCE_API}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

    return this.http.get<any[]>(url).pipe(
      map(data => this.transformKlineData(data)),
      catchError(error => {
        console.error('Error fetching klines:', error);
        return [];
      })
    );
  }

  /**
   * Obtiene precio actual de un par
   */
  getCurrentPrice(symbol: string): Observable<number> {
    const url = `${this.BINANCE_API}/ticker/price?symbol=${symbol}`;

    return this.http.get<any>(url).pipe(
      map(data => parseFloat(data.price)),
      catchError(error => {
        console.error('Error fetching current price:', error);
        return [0];
      })
    );
  }

  /**
   * Crea un observable que emite datos de velas a intervalos regulares
   */
  getKlinesStream(symbol: string, timeInterval: string, refreshMs: number, limit: number = 500): Observable<CandleData[]> {
    if (refreshMs === 0) {
      // Si es manual, solo emite una vez
      return this.getKlines(symbol, timeInterval, limit);
    }

    // Emite inmediatamente y luego a intervalos
    return interval(refreshMs).pipe(
      switchMap(() => this.getKlines(symbol, timeInterval, limit))
    );
  }

  /**
   * Obtiene información de 24h para un par
   */
  get24hStats(symbol: string): Observable<any> {
    const url = `${this.BINANCE_API}/ticker/24hr?symbol=${symbol}`;

    return this.http.get<any>(url).pipe(
      map(data => ({
        priceChange: parseFloat(data.priceChange),
        priceChangePercent: parseFloat(data.priceChangePercent),
        highPrice: parseFloat(data.highPrice),
        lowPrice: parseFloat(data.lowPrice),
        volume: parseFloat(data.volume),
        quoteVolume: parseFloat(data.quoteVolume)
      })),
      catchError(error => {
        console.error('Error fetching 24h stats:', error);
        return [null];
      })
    );
  }

  /**
   * Transforma datos de Binance API al formato CandleData
   */
  private transformKlineData(data: any[]): CandleData[] {
    return data.map(candle => ({
      time: candle[0] / 1000, // Binance usa ms, convertimos a segundos
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[5])
    }));
  }

  /**
   * Valida si un símbolo existe en Binance
   */
  validateSymbol(symbol: string): Observable<boolean> {
    const url = `${this.BINANCE_API}/exchangeInfo?symbol=${symbol}`;

    return this.http.get<any>(url).pipe(
      map(data => data.symbols && data.symbols.length > 0),
      catchError(() => [false])
    );
  }
}

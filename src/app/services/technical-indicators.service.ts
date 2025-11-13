import { Injectable } from '@angular/core';
import { CandleData, RSIData, VolumeProfileData, Divergence } from '../models/trading.models';

@Injectable({
  providedIn: 'root'
})
export class TechnicalIndicatorsService {

  /**
   * Calcula el RSI (Relative Strength Index)
   * @param data Array de datos de velas
   * @param period Período para el cálculo (default: 14)
   */
  calculateRSI(data: CandleData[], period: number = 14): RSIData[] {
    if (data.length < period + 1) {
      return [];
    }

    const rsiData: RSIData[] = [];
    const changes: number[] = [];

    // Calcular cambios de precio
    for (let i = 1; i < data.length; i++) {
      changes.push(data[i].close - data[i - 1].close);
    }

    // Calcular primera media de ganancias y pérdidas
    let avgGain = 0;
    let avgLoss = 0;

    for (let i = 0; i < period; i++) {
      if (changes[i] > 0) {
        avgGain += changes[i];
      } else {
        avgLoss += Math.abs(changes[i]);
      }
    }

    avgGain /= period;
    avgLoss /= period;

    // Calcular RSI para el primer punto
    let rs = avgGain / (avgLoss || 1);
    let rsi = 100 - (100 / (1 + rs));
    rsiData.push({ time: data[period].time, value: rsi });

    // Calcular RSI para el resto de puntos usando media móvil suavizada
    for (let i = period; i < changes.length; i++) {
      const change = changes[i];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;

      rs = avgGain / (avgLoss || 1);
      rsi = 100 - (100 / (1 + rs));

      rsiData.push({ time: data[i + 1].time, value: rsi });
    }

    return rsiData;
  }

  /**
   * Detecta divergencias alcistas y bajistas entre precio y RSI
   */
  detectDivergences(candleData: CandleData[], rsiData: RSIData[], lookbackPeriod: number = 50): Divergence[] {
    if (candleData.length < lookbackPeriod || rsiData.length < lookbackPeriod) {
      return [];
    }

    const divergences: Divergence[] = [];
    const recentCandles = candleData.slice(-lookbackPeriod);
    const recentRSI = rsiData.slice(-lookbackPeriod);

    // Encontrar pivotes locales (mínimos y máximos)
    const pricePivots = this.findPivots(recentCandles);
    const rsiPivots = this.findRSIPivots(recentRSI);

    // Detectar divergencias alcistas (precio hace mínimos más bajos, RSI hace mínimos más altos)
    for (let i = 1; i < pricePivots.lows.length; i++) {
      const priceIdx1 = pricePivots.lows[i - 1];
      const priceIdx2 = pricePivots.lows[i];

      // Buscar pivotes de RSI cercanos
      const rsiIdx1 = this.findClosestRSIPivot(rsiPivots.lows, priceIdx1);
      const rsiIdx2 = this.findClosestRSIPivot(rsiPivots.lows, priceIdx2);

      if (rsiIdx1 !== -1 && rsiIdx2 !== -1) {
        const priceLower = recentCandles[priceIdx2].low < recentCandles[priceIdx1].low;
        const rsiHigher = recentRSI[rsiIdx2].value > recentRSI[rsiIdx1].value;

        if (priceLower && rsiHigher) {
          divergences.push({
            type: 'bullish',
            startTime: recentCandles[priceIdx1].time,
            endTime: recentCandles[priceIdx2].time,
            priceStart: recentCandles[priceIdx1].low,
            priceEnd: recentCandles[priceIdx2].low,
            rsiStart: recentRSI[rsiIdx1].value,
            rsiEnd: recentRSI[rsiIdx2].value
          });
        }
      }
    }

    // Detectar divergencias bajistas (precio hace máximos más altos, RSI hace máximos más bajos)
    for (let i = 1; i < pricePivots.highs.length; i++) {
      const priceIdx1 = pricePivots.highs[i - 1];
      const priceIdx2 = pricePivots.highs[i];

      const rsiIdx1 = this.findClosestRSIPivot(rsiPivots.highs, priceIdx1);
      const rsiIdx2 = this.findClosestRSIPivot(rsiPivots.highs, priceIdx2);

      if (rsiIdx1 !== -1 && rsiIdx2 !== -1) {
        const priceHigher = recentCandles[priceIdx2].high > recentCandles[priceIdx1].high;
        const rsiLower = recentRSI[rsiIdx2].value < recentRSI[rsiIdx1].value;

        if (priceHigher && rsiLower) {
          divergences.push({
            type: 'bearish',
            startTime: recentCandles[priceIdx1].time,
            endTime: recentCandles[priceIdx2].time,
            priceStart: recentCandles[priceIdx1].high,
            priceEnd: recentCandles[priceIdx2].high,
            rsiStart: recentRSI[rsiIdx1].value,
            rsiEnd: recentRSI[rsiIdx2].value
          });
        }
      }
    }

    return divergences;
  }

  /**
   * Calcula Fixed Range Volume Profile
   */
  calculateVolumeProfile(data: CandleData[], range: number, bins: number = 24): VolumeProfileData[] {
    if (data.length < range) {
      range = data.length;
    }

    const recentData = data.slice(-range);

    // Encontrar rango de precios
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    recentData.forEach(candle => {
      minPrice = Math.min(minPrice, candle.low);
      maxPrice = Math.max(maxPrice, candle.high);
    });

    const priceStep = (maxPrice - minPrice) / bins;
    const volumeProfile: VolumeProfileData[] = [];

    // Inicializar bins
    for (let i = 0; i < bins; i++) {
      volumeProfile.push({
        price: minPrice + (i + 0.5) * priceStep,
        volume: 0
      });
    }

    // Distribuir volumen en los bins
    recentData.forEach(candle => {
      const avgPrice = (candle.high + candle.low) / 2;
      const binIndex = Math.min(
        Math.floor((avgPrice - minPrice) / priceStep),
        bins - 1
      );

      if (binIndex >= 0 && binIndex < bins) {
        volumeProfile[binIndex].volume += candle.volume;
      }
    });

    return volumeProfile.filter(vp => vp.volume > 0);
  }

  /**
   * Encuentra pivotes locales en los datos de precio
   */
  private findPivots(data: CandleData[], leftBars: number = 5, rightBars: number = 5): { highs: number[], lows: number[] } {
    const highs: number[] = [];
    const lows: number[] = [];

    for (let i = leftBars; i < data.length - rightBars; i++) {
      let isHigh = true;
      let isLow = true;

      // Verificar si es un máximo local
      for (let j = i - leftBars; j <= i + rightBars; j++) {
        if (j !== i && data[j].high >= data[i].high) {
          isHigh = false;
        }
        if (j !== i && data[j].low <= data[i].low) {
          isLow = false;
        }
      }

      if (isHigh) highs.push(i);
      if (isLow) lows.push(i);
    }

    return { highs, lows };
  }

  /**
   * Encuentra pivotes en los datos de RSI
   */
  private findRSIPivots(data: RSIData[], leftBars: number = 5, rightBars: number = 5): { highs: number[], lows: number[] } {
    const highs: number[] = [];
    const lows: number[] = [];

    for (let i = leftBars; i < data.length - rightBars; i++) {
      let isHigh = true;
      let isLow = true;

      for (let j = i - leftBars; j <= i + rightBars; j++) {
        if (j !== i && data[j].value >= data[i].value) {
          isHigh = false;
        }
        if (j !== i && data[j].value <= data[i].value) {
          isLow = false;
        }
      }

      if (isHigh) highs.push(i);
      if (isLow) lows.push(i);
    }

    return { highs, lows };
  }

  /**
   * Encuentra el pivote de RSI más cercano a un índice dado
   */
  private findClosestRSIPivot(pivots: number[], targetIndex: number): number {
    if (pivots.length === 0) return -1;

    let closest = pivots[0];
    let minDistance = Math.abs(pivots[0] - targetIndex);

    for (const pivot of pivots) {
      const distance = Math.abs(pivot - targetIndex);
      if (distance < minDistance) {
        minDistance = distance;
        closest = pivot;
      }
    }

    // Solo aceptar si está dentro de un rango razonable (5 velas)
    return minDistance <= 5 ? closest : -1;
  }
}

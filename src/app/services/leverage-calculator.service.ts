import { Injectable } from '@angular/core';
import { LeverageCalculation, OrderSetup } from '../models/trading.models';

@Injectable({
  providedIn: 'root'
})
export class LeverageCalculatorService {

  // Tasas de comisión de BingX
  private readonly MAKER_FEE = 0.0002; // 0.02%
  private readonly TAKER_FEE = 0.0004; // 0.04%

  // Funding rate típico (varía, usamos un promedio)
  private readonly FUNDING_RATE_8H = 0.0001; // 0.01% cada 8 horas

  /**
   * Calcula el precio de liquidación para una posición
   */
  calculateLiquidationPrice(
    entryPrice: number,
    leverage: number,
    positionType: 'long' | 'short'
  ): number {
    // Margen de mantenimiento aproximado (1%)
    const maintenanceMargin = 0.01;

    if (positionType === 'long') {
      // Para Long: Liquidación = Precio Entrada * (1 - 1/apalancamiento + margen mantenimiento)
      return entryPrice * (1 - (1 / leverage) + maintenanceMargin);
    } else {
      // Para Short: Liquidación = Precio Entrada * (1 + 1/apalancamiento - margen mantenimiento)
      return entryPrice * (1 + (1 / leverage) - maintenanceMargin);
    }
  }

  /**
   * Calcula los fees de funding para un período dado
   */
  calculateFundingFees(
    positionValue: number,
    days: number
  ): number {
    // 3 pagos de funding por día (cada 8 horas)
    const paymentsPerDay = 3;
    const totalPayments = days * paymentsPerDay;

    return positionValue * this.FUNDING_RATE_8H * totalPayments;
  }

  /**
   * Realiza todos los cálculos de apalancamiento
   */
  calculate(
    investment: number,
    entryPrice: number,
    leverage: number,
    targetPrice: number,
    days: number,
    positionType: 'long' | 'short',
    useMaker: boolean = true
  ): LeverageCalculation {
    // Valor de la posición
    const positionValue = investment * leverage;

    // Cantidad de contratos
    const contracts = positionValue / entryPrice;

    // Precio de liquidación
    const liquidationPrice = this.calculateLiquidationPrice(entryPrice, leverage, positionType);

    // Cambio de precio
    const priceChange = targetPrice - entryPrice;
    const priceChangePercent = (priceChange / entryPrice) * 100;

    // Ganancia/pérdida bruta
    let potentialProfit: number;
    if (positionType === 'long') {
      potentialProfit = contracts * priceChange;
    } else {
      potentialProfit = contracts * -priceChange;
    }

    // Comisiones
    const feeRate = useMaker ? this.MAKER_FEE : this.TAKER_FEE;
    const openingFee = positionValue * feeRate;
    const closingValue = contracts * targetPrice;
    const closingFee = closingValue * feeRate;

    // Funding fees
    const fundingFees = this.calculateFundingFees(positionValue, days);

    // Total de comisiones
    const totalFees = openingFee + closingFee + fundingFees;

    // Ganancia neta
    const netProfit = potentialProfit - totalFees;

    // ROI
    const roi = (netProfit / investment) * 100;

    // Pérdida potencial (si alcanza liquidación)
    const potentialLoss = investment; // En liquidación se pierde todo el margen

    return {
      investment,
      entryPrice,
      leverage,
      targetPrice,
      days,
      positionType,
      liquidationPrice,
      potentialProfit,
      potentialLoss,
      openingFee,
      closingFee,
      fundingFees,
      totalFees,
      netProfit,
      roi
    };
  }

  /**
   * Calcula el setup óptimo de una orden basado en gestión de riesgo
   */
  calculateOrderSetup(
    currentPrice: number,
    capital: number,
    riskPercentage: number,
    rewardRiskRatio: number,
    orderType: 'long' | 'short'
  ): Partial<OrderSetup> {
    // Cantidad que estamos dispuestos a perder
    const maxLoss = capital * (riskPercentage / 100);

    // Calcular stop loss (ejemplo: 2% del precio para long, -2% para short)
    const stopLossBasePercent = 2; // Porcentaje base
    let stopLoss: number;

    if (orderType === 'long') {
      stopLoss = currentPrice * (1 - stopLossBasePercent / 100);
    } else {
      stopLoss = currentPrice * (1 + stopLossBasePercent / 100);
    }

    // Distancia al stop loss
    const stopLossDistance = Math.abs(currentPrice - stopLoss);
    const stopLossPercent = (stopLossDistance / currentPrice) * 100;

    // Calcular apalancamiento sugerido basado en el riesgo
    // Si queremos perder solo riskPercentage% con un stop loss de X%,
    // entonces apalancamiento = riskPercentage / stopLossPercent
    const suggestedLeverage = Math.min(
      Math.floor(riskPercentage / stopLossPercent),
      125 // Límite máximo
    );

    // Tamaño de posición
    const positionSize = (maxLoss / stopLossPercent) * 100;

    // Take profit basado en ratio R:R
    const takeProfitDistance = stopLossDistance * rewardRiskRatio;
    let takeProfit: number;

    if (orderType === 'long') {
      takeProfit = currentPrice + takeProfitDistance;
    } else {
      takeProfit = currentPrice - takeProfitDistance;
    }

    // Calcular liquidación con el apalancamiento sugerido
    const liquidationPrice = this.calculateLiquidationPrice(
      currentPrice,
      suggestedLeverage,
      orderType
    );

    // Ganancia potencial
    const potentialGain = maxLoss * rewardRiskRatio;
    const potentialGainPercent = (potentialGain / capital) * 100;
    const maxLossPercent = (maxLoss / capital) * 100;

    return {
      orderType,
      currentPrice,
      capital,
      riskPercentage,
      rewardRiskRatio,
      suggestedLeverage,
      positionSize,
      stopLoss,
      takeProfit,
      liquidationPrice,
      potentialGain,
      potentialGainPercent,
      maxLoss,
      maxLossPercent
    };
  }

  /**
   * Valida que el precio objetivo sea alcanzable antes de la liquidación
   */
  isTargetReachable(
    entryPrice: number,
    targetPrice: number,
    liquidationPrice: number,
    positionType: 'long' | 'short'
  ): boolean {
    if (positionType === 'long') {
      return targetPrice > entryPrice && liquidationPrice < entryPrice;
    } else {
      return targetPrice < entryPrice && liquidationPrice > entryPrice;
    }
  }

  /**
   * Calcula el apalancamiento máximo seguro para un stop loss dado
   */
  calculateMaxSafeLeverage(
    stopLossPercent: number,
    buffer: number = 1.5
  ): number {
    // Dejamos un buffer para no estar muy cerca de la liquidación
    return Math.floor((100 / stopLossPercent) / buffer);
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CryptoDataService } from '../../services/crypto-data.service';
import { LeverageCalculatorService } from '../../services/leverage-calculator.service';
import { TradingPair, OrderSetup } from '../../models/trading.models';

@Component({
  selector: 'app-order-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-setup.component.html',
  styleUrls: ['./order-setup.component.scss']
})
export class OrderSetupComponent implements OnInit, OnDestroy {
  // Trading pairs
  tradingPairs: TradingPair[] = [];
  selectedPair: TradingPair;

  // Inputs
  orderType: 'long' | 'short' = 'long';
  currentPrice: number = 0;
  capital: number = 1000;
  riskPercentage: number = 2;
  rewardRiskRatio: number = 2;

  // Calculado
  setup?: Partial<OrderSetup>;
  isLoading: boolean = false;
  isCalculated: boolean = false;

  // Auto-refresh
  private destroy$ = new Subject<void>();
  private priceRefreshTimer?: any;

  // Risk percentage options
  readonly riskOptions = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

  // Reward/Risk ratio options
  readonly rrRatioOptions = [
    { value: 1, label: '1:1' },
    { value: 1.5, label: '1.5:1' },
    { value: 2, label: '2:1' },
    { value: 2.5, label: '2.5:1' },
    { value: 3, label: '3:1' },
    { value: 4, label: '4:1' },
    { value: 5, label: '5:1' }
  ];

  constructor(
    private cryptoDataService: CryptoDataService,
    private leverageCalculator: LeverageCalculatorService
  ) {
    this.tradingPairs = this.cryptoDataService.DEFAULT_PAIRS;
    this.selectedPair = this.tradingPairs[0];
  }

  ngOnInit(): void {
    this.loadCurrentPrice();
    this.startPriceAutoRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.priceRefreshTimer) {
      clearInterval(this.priceRefreshTimer);
    }
  }

  /**
   * Carga el precio actual del par seleccionado
   */
  private loadCurrentPrice(): void {
    this.isLoading = true;

    this.cryptoDataService
      .getCurrentPrice(this.selectedPair.symbol)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (price) => {
          this.currentPrice = price;
          this.isLoading = false;
          if (price > 0) {
            this.calculateSetup();
          }
        },
        error: (error) => {
          console.error('Error loading price:', error);
          this.isLoading = false;
        }
      });
  }

  /**
   * Inicia el auto-refresh del precio cada 10 segundos
   */
  private startPriceAutoRefresh(): void {
    this.priceRefreshTimer = setInterval(() => {
      this.loadCurrentPrice();
    }, 10000);
  }

  /**
   * Calcula el setup de la orden
   */
  calculateSetup(): void {
    if (this.currentPrice <= 0) {
      return;
    }

    this.setup = this.leverageCalculator.calculateOrderSetup(
      this.currentPrice,
      this.capital,
      this.riskPercentage,
      this.rewardRiskRatio,
      this.orderType
    );

    this.isCalculated = true;
  }

  /**
   * Handlers
   */
  onPairChange(): void {
    const pair = this.tradingPairs.find(p => p.symbol === this.selectedPair.symbol);
    if (pair) {
      this.selectedPair = pair;
      this.loadCurrentPrice();
    }
  }

  onOrderTypeChange(type: 'long' | 'short'): void {
    this.orderType = type;
    this.calculateSetup();
  }

  onCapitalChange(): void {
    if (this.capital < 10) this.capital = 10;
    if (this.capital > 1000000) this.capital = 1000000;
    this.calculateSetup();
  }

  onRiskPercentageChange(): void {
    if (this.riskPercentage < 0.1) this.riskPercentage = 0.1;
    if (this.riskPercentage > 10) this.riskPercentage = 10;
    this.calculateSetup();
  }

  onRewardRiskRatioChange(): void {
    if (this.rewardRiskRatio < 0.5) this.rewardRiskRatio = 0.5;
    if (this.rewardRiskRatio > 10) this.rewardRiskRatio = 10;
    this.calculateSetup();
  }

  /**
   * Obtiene el nivel de riesgo del setup
   */
  get setupRiskLevel(): 'low' | 'medium' | 'high' | 'extreme' {
    if (!this.setup?.suggestedLeverage) return 'low';

    if (this.setup.suggestedLeverage <= 5) return 'low';
    if (this.setup.suggestedLeverage <= 20) return 'medium';
    if (this.setup.suggestedLeverage <= 50) return 'high';
    return 'extreme';
  }

  get setupRiskLevelText(): string {
    switch (this.setupRiskLevel) {
      case 'low': return 'Conservador';
      case 'medium': return 'Moderado';
      case 'high': return 'Agresivo';
      case 'extreme': return 'Muy Agresivo';
    }
  }

  get setupRiskLevelColor(): string {
    switch (this.setupRiskLevel) {
      case 'low': return '#26a69a';
      case 'medium': return '#ffeb3b';
      case 'high': return '#ff9800';
      case 'extreme': return '#ef5350';
    }
  }

  /**
   * Calcula la distancia al stop loss
   */
  get stopLossDistance(): number {
    if (!this.setup?.stopLoss) return 0;
    const distance = Math.abs(this.currentPrice - this.setup.stopLoss);
    return (distance / this.currentPrice) * 100;
  }

  /**
   * Calcula la distancia al take profit
   */
  get takeProfitDistance(): number {
    if (!this.setup?.takeProfit) return 0;
    const distance = Math.abs(this.setup.takeProfit - this.currentPrice);
    return (distance / this.currentPrice) * 100;
  }

  /**
   * Calcula la distancia a la liquidación
   */
  get liquidationDistance(): number {
    if (!this.setup?.liquidationPrice) return 0;
    const distance = Math.abs(this.currentPrice - this.setup.liquidationPrice);
    return (distance / this.currentPrice) * 100;
  }

  /**
   * Valida que el setup sea seguro
   */
  get isSetupSafe(): boolean {
    if (!this.setup) return false;

    // Verificar que la liquidación esté lejos del stop loss
    if (this.orderType === 'long') {
      return this.setup.liquidationPrice! < this.setup.stopLoss!;
    } else {
      return this.setup.liquidationPrice! > this.setup.stopLoss!;
    }
  }

  get setupWarning(): string {
    if (this.isSetupSafe) return '';

    return 'Advertencia: El precio de liquidación está muy cerca del stop loss. Considera reducir el apalancamiento.';
  }

  /**
   * Formatters
   */
  formatPrice(price: number): string {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    });
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  formatPercent(percent: number): string {
    return percent.toFixed(2);
  }

  /**
   * Copia el resumen al portapapeles
   */
  copySetupToClipboard(): void {
    if (!this.setup) return;

    const summary = `
📊 Setup de Orden - ${this.selectedPair.displayName}
━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 Tipo: ${this.orderType.toUpperCase()}
💰 Capital: ${this.formatCurrency(this.capital)} USDT
⚖️ Apalancamiento: ${this.setup.suggestedLeverage}x
📈 Tamaño Posición: ${this.formatCurrency(this.setup.positionSize!)} USDT

📍 Precios:
   Entrada: ${this.formatPrice(this.currentPrice)}
   Stop Loss: ${this.formatPrice(this.setup.stopLoss!)} (${this.formatPercent(this.stopLossDistance)}%)
   Take Profit: ${this.formatPrice(this.setup.takeProfit!)} (${this.formatPercent(this.takeProfitDistance)}%)
   Liquidación: ${this.formatPrice(this.setup.liquidationPrice!)} (${this.formatPercent(this.liquidationDistance)}%)

💵 Resultados:
   Ganancia Potencial: +${this.formatCurrency(this.setup.potentialGain!)} USDT (${this.formatPercent(this.setup.potentialGainPercent!)}%)
   Pérdida Máxima: -${this.formatCurrency(this.setup.maxLoss!)} USDT (${this.formatPercent(this.setup.maxLossPercent!)}%)
   Ratio R:R: ${this.rewardRiskRatio}:1

⚠️ Riesgo: ${this.setupRiskLevelText}
    `.trim();

    navigator.clipboard.writeText(summary).then(
      () => {
        alert('Setup copiado al portapapeles ✓');
      },
      () => {
        alert('Error al copiar al portapapeles');
      }
    );
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeverageCalculatorService } from '../../services/leverage-calculator.service';
import { LeverageCalculation } from '../../models/trading.models';

@Component({
  selector: 'app-leverage-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './leverage-calculator.component.html',
  styleUrls: ['./leverage-calculator.component.scss']
})
export class LeverageCalculatorComponent implements OnInit {
  // Inputs
  investment: number = 100;
  entryPrice: number = 50000;
  leverage: number = 10;
  targetPrice: number = 55000;
  days: number = 7;
  positionType: 'long' | 'short' = 'long';
  useMakerFees: boolean = true;

  // Results
  calculation?: LeverageCalculation;
  isCalculated: boolean = false;

  // Leverage slider values
  readonly leverageMarks = [1, 5, 10, 20, 50, 75, 100, 125];

  constructor(private calculatorService: LeverageCalculatorService) {}

  ngOnInit(): void {
    this.calculate();
  }

  /**
   * Realiza el cálculo de apalancamiento
   */
  calculate(): void {
    this.calculation = this.calculatorService.calculate(
      this.investment,
      this.entryPrice,
      this.leverage,
      this.targetPrice,
      this.days,
      this.positionType,
      this.useMakerFees
    );

    this.isCalculated = true;
  }

  /**
   * Cambia el tipo de posición
   */
  setPositionType(type: 'long' | 'short'): void {
    this.positionType = type;
    this.calculate();
  }

  /**
   * Handlers de cambio
   */
  onInvestmentChange(): void {
    if (this.investment < 1) this.investment = 1;
    if (this.investment > 1000000) this.investment = 1000000;
    this.calculate();
  }

  onEntryPriceChange(): void {
    if (this.entryPrice < 0.01) this.entryPrice = 0.01;
    this.calculate();
  }

  onLeverageChange(): void {
    if (this.leverage < 1) this.leverage = 1;
    if (this.leverage > 125) this.leverage = 125;
    this.calculate();
  }

  onTargetPriceChange(): void {
    if (this.targetPrice < 0.01) this.targetPrice = 0.01;
    this.calculate();
  }

  onDaysChange(): void {
    if (this.days < 0.1) this.days = 0.1;
    if (this.days > 365) this.days = 365;
    this.calculate();
  }

  onFeeTypeChange(): void {
    this.calculate();
  }

  /**
   * Valida si el target es alcanzable
   */
  get isTargetReachable(): boolean {
    if (!this.calculation) return false;

    return this.calculatorService.isTargetReachable(
      this.entryPrice,
      this.targetPrice,
      this.calculation.liquidationPrice,
      this.positionType
    );
  }

  /**
   * Obtiene mensaje de advertencia si el target no es alcanzable
   */
  get warningMessage(): string {
    if (this.isTargetReachable) return '';

    if (this.positionType === 'long') {
      if (this.targetPrice <= this.entryPrice) {
        return 'El precio objetivo debe ser mayor que el precio de entrada para una posición Long';
      }
      return 'El precio de liquidación está muy cerca del precio objetivo. Reduce el apalancamiento.';
    } else {
      if (this.targetPrice >= this.entryPrice) {
        return 'El precio objetivo debe ser menor que el precio de entrada para una posición Short';
      }
      return 'El precio de liquidación está muy cerca del precio objetivo. Reduce el apalancamiento.';
    }
  }

  /**
   * Obtiene nivel de riesgo basado en ROI y apalancamiento
   */
  get riskLevel(): 'low' | 'medium' | 'high' | 'extreme' {
    if (this.leverage <= 5) return 'low';
    if (this.leverage <= 20) return 'medium';
    if (this.leverage <= 50) return 'high';
    return 'extreme';
  }

  get riskLevelText(): string {
    switch (this.riskLevel) {
      case 'low': return 'Bajo';
      case 'medium': return 'Medio';
      case 'high': return 'Alto';
      case 'extreme': return 'Extremo';
    }
  }

  get riskLevelColor(): string {
    switch (this.riskLevel) {
      case 'low': return '#26a69a';
      case 'medium': return '#ffeb3b';
      case 'high': return '#ff9800';
      case 'extreme': return '#ef5350';
    }
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
   * Cálculos auxiliares para la UI
   */
  get positionValue(): number {
    return this.investment * this.leverage;
  }

  get distanceToLiquidation(): number {
    if (!this.calculation) return 0;

    const distance = Math.abs(this.entryPrice - this.calculation.liquidationPrice);
    return (distance / this.entryPrice) * 100;
  }

  get isPositiveROI(): boolean {
    return this.calculation ? this.calculation.roi > 0 : false;
  }
}

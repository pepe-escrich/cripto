import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { createChart, CandlestickData, LineData, HistogramData } from 'lightweight-charts';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CryptoDataService } from '../../services/crypto-data.service';
import { TechnicalIndicatorsService } from '../../services/technical-indicators.service';
import { TradingPair, Timeframe, RefreshInterval, CandleData, ChartSettings } from '../../models/trading.models';

@Component({
  selector: 'app-chart-analyzer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chart-analyzer.component.html',
  styleUrls: ['./chart-analyzer.component.scss']
})
export class ChartAnalyzerComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('chartContainer', { static: false }) chartContainer!: ElementRef;

  // Chart instance
  private chart?: any;
  private candlestickSeries?: any;
  private rsiSeries?: any;
  private volumeSeries?: any;

  // Data
  tradingPairs: TradingPair[] = [];
  timeframes: Timeframe[] = [];
  refreshIntervals: RefreshInterval[] = [];

  // Selected values
  selectedPair: TradingPair;
  selectedTimeframe: Timeframe;
  selectedRefreshInterval: RefreshInterval;
  customPairSymbol: string = '';

  // Settings
  settings: ChartSettings = {
    pair: { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', displayName: 'BTC/USDT' },
    timeframe: { value: '1h', label: '1h', minutes: 60 },
    refreshInterval: { value: 10000, label: '10s' },
    indicators: {
      rsi: true,
      frvpLongTerm: false,
      frvpShortTerm: false,
      divergences: true
    },
    frvpLongTermPeriod: 200,
    frvpShortTermPeriod: 50
  };

  // Stats
  currentPrice: number = 0;
  priceChange: number = 0;
  priceChangePercent: number = 0;
  volume24h: number = 0;

  // Indicators data
  rsiValue: number = 0;
  divergencesCount: number = 0;

  // Loading state
  isLoading: boolean = false;
  private destroy$ = new Subject<void>();
  private refreshTimer?: any;

  constructor(
    private cryptoDataService: CryptoDataService,
    private indicatorsService: TechnicalIndicatorsService
  ) {
    this.tradingPairs = this.cryptoDataService.DEFAULT_PAIRS;
    this.timeframes = this.cryptoDataService.TIMEFRAMES;
    this.refreshIntervals = this.cryptoDataService.REFRESH_INTERVALS;

    this.selectedPair = this.settings.pair;
    this.selectedTimeframe = this.settings.timeframe;
    this.selectedRefreshInterval = this.settings.refreshInterval;
  }

  ngOnInit(): void {
    this.loadChartData();
    this.setupAutoRefresh();
  }

  ngAfterViewInit(): void {
    this.initializeChart();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    if (this.chart) {
      this.chart.remove();
    }
  }

  /**
   * Inicializa el gráfico de TradingView Lightweight Charts
   */
  private initializeChart(): void {
    if (!this.chartContainer) {
      return;
    }

    const container = this.chartContainer.nativeElement;

    this.chart = createChart(container, {
      width: container.clientWidth,
      height: 500,
      layout: {
        background: { color: '#1a1a1a' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#2B2B43' },
        horzLines: { color: '#2B2B43' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#2B2B43',
      },
      timeScale: {
        borderColor: '#2B2B43',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Crear serie de candlesticks
    this.candlestickSeries = (this.chart as any).addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    // Handle resize
    window.addEventListener('resize', this.handleResize.bind(this));

    // Cargar datos
    this.loadChartData();
  }

  private handleResize(): void {
    if (this.chart && this.chartContainer) {
      const container = this.chartContainer.nativeElement;
      this.chart.applyOptions({
        width: container.clientWidth,
      });
    }
  }

  /**
   * Carga los datos del gráfico
   */
  private loadChartData(): void {
    this.isLoading = true;

    this.cryptoDataService
      .getKlines(this.selectedPair.symbol, this.selectedTimeframe.value, 500)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.updateChart(data);
          this.updateStats();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading chart data:', error);
          this.isLoading = false;
        }
      });
  }

  /**
   * Actualiza el gráfico con nuevos datos
   */
  private updateChart(data: CandleData[]): void {
    if (!this.candlestickSeries || data.length === 0) {
      return;
    }

    // Convertir a formato de lightweight-charts
    const candleData: CandlestickData[] = data.map(d => ({
      time: d.time as any,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    this.candlestickSeries.setData(candleData);

    // Actualizar precio actual
    const lastCandle = data[data.length - 1];
    this.currentPrice = lastCandle.close;

    // Calcular y mostrar RSI si está habilitado
    if (this.settings.indicators.rsi) {
      this.updateRSI(data);
    }

    // Detectar divergencias si está habilitado
    if (this.settings.indicators.divergences && this.settings.indicators.rsi) {
      this.updateDivergences(data);
    }

    // Calcular Volume Profile si está habilitado
    if (this.settings.indicators.frvpLongTerm || this.settings.indicators.frvpShortTerm) {
      this.updateVolumeProfile(data);
    }

    // Fit content
    if (this.chart) {
      this.chart.timeScale().fitContent();
    }
  }

  /**
   * Actualiza el indicador RSI
   */
  private updateRSI(data: CandleData[]): void {
    const rsiData = this.indicatorsService.calculateRSI(data, 14);

    if (rsiData.length > 0) {
      this.rsiValue = rsiData[rsiData.length - 1].value;

      // Crear o actualizar serie de RSI (en un subgráfico sería ideal)
      // Por ahora solo guardamos el valor
    }
  }

  /**
   * Actualiza la detección de divergencias
   */
  private updateDivergences(data: CandleData[]): void {
    const rsiData = this.indicatorsService.calculateRSI(data, 14);
    const divergences = this.indicatorsService.detectDivergences(data, rsiData, 50);

    this.divergencesCount = divergences.length;

    // Aquí se podrían dibujar las divergencias en el gráfico usando markers
    // Nota: La funcionalidad de markers puede variar según la versión de lightweight-charts
    if (this.candlestickSeries && divergences.length > 0) {
      try {
        const markers = divergences.map(div => ({
          time: div.endTime as any,
          position: div.type === 'bullish' ? 'belowBar' as const : 'aboveBar' as const,
          color: div.type === 'bullish' ? '#26a69a' : '#ef5350',
          shape: div.type === 'bullish' ? 'arrowUp' as const : 'arrowDown' as const,
          text: div.type === 'bullish' ? 'Bullish Div' : 'Bearish Div',
        }));

        (this.candlestickSeries as any).setMarkers?.(markers);
      } catch (e) {
        console.log('Markers not supported in this version');
      }
    }
  }

  /**
   * Actualiza el Volume Profile
   */
  private updateVolumeProfile(data: CandleData[]): void {
    if (this.settings.indicators.frvpLongTerm) {
      const vpLong = this.indicatorsService.calculateVolumeProfile(
        data,
        this.settings.frvpLongTermPeriod
      );
      // Aquí se podría dibujar el volume profile en el gráfico
    }

    if (this.settings.indicators.frvpShortTerm) {
      const vpShort = this.indicatorsService.calculateVolumeProfile(
        data,
        this.settings.frvpShortTermPeriod
      );
      // Aquí se podría dibujar el volume profile en el gráfico
    }
  }

  /**
   * Actualiza estadísticas de 24h
   */
  private updateStats(): void {
    this.cryptoDataService
      .get24hStats(this.selectedPair.symbol)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          if (stats) {
            this.priceChange = stats.priceChange;
            this.priceChangePercent = stats.priceChangePercent;
            this.volume24h = stats.volume;
          }
        },
        error: (error) => {
          console.error('Error loading stats:', error);
        }
      });
  }

  /**
   * Configura el auto-refresh
   */
  private setupAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    if (this.selectedRefreshInterval.value > 0) {
      this.refreshTimer = setInterval(() => {
        this.loadChartData();
      }, this.selectedRefreshInterval.value);
    }
  }

  /**
   * Handlers de eventos
   */
  onPairChange(): void {
    this.selectedPair = this.tradingPairs.find(p => p.symbol === this.selectedPair.symbol) || this.tradingPairs[0];
    this.settings.pair = this.selectedPair;
    this.loadChartData();
  }

  onTimeframeChange(): void {
    const tf = this.timeframes.find(t => t.value === this.selectedTimeframe.value);
    if (tf) {
      this.selectedTimeframe = tf;
      this.settings.timeframe = tf;
      this.loadChartData();
    }
  }

  onRefreshIntervalChange(): void {
    const ri = this.refreshIntervals.find(r => r.value === this.selectedRefreshInterval.value);
    if (ri) {
      this.selectedRefreshInterval = ri;
      this.settings.refreshInterval = ri;
      this.setupAutoRefresh();
    }
  }

  onAddCustomPair(): void {
    if (!this.customPairSymbol) {
      return;
    }

    const symbol = this.customPairSymbol.toUpperCase();

    this.cryptoDataService.validateSymbol(symbol).subscribe({
      next: (isValid) => {
        if (isValid) {
          const customPair: TradingPair = {
            symbol: symbol,
            baseAsset: symbol.replace('USDT', ''),
            quoteAsset: 'USDT',
            displayName: symbol.replace('USDT', '/USDT')
          };

          if (!this.tradingPairs.find(p => p.symbol === symbol)) {
            this.tradingPairs.push(customPair);
            this.selectedPair = customPair;
            this.settings.pair = customPair;
            this.loadChartData();
          }

          this.customPairSymbol = '';
        } else {
          alert('Par de trading no válido');
        }
      },
      error: () => {
        alert('Error al validar el par de trading');
      }
    });
  }

  onToggleIndicator(indicator: keyof typeof this.settings.indicators): void {
    this.settings.indicators[indicator] = !this.settings.indicators[indicator];
    this.loadChartData();
  }

  onManualRefresh(): void {
    this.loadChartData();
  }

  // Formatters
  formatPrice(price: number): string {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    });
  }

  formatVolume(volume: number): string {
    if (volume >= 1e9) {
      return (volume / 1e9).toFixed(2) + 'B';
    } else if (volume >= 1e6) {
      return (volume / 1e6).toFixed(2) + 'M';
    } else if (volume >= 1e3) {
      return (volume / 1e3).toFixed(2) + 'K';
    }
    return volume.toFixed(2);
  }

  get isPriceUp(): boolean {
    return this.priceChangePercent >= 0;
  }

  get isRSIOverbought(): boolean {
    return this.rsiValue >= 70;
  }

  get isRSIOversold(): boolean {
    return this.rsiValue <= 30;
  }
}

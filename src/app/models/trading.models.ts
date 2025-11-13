// Modelos para la aplicación de análisis crypto

export interface TradingPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  displayName: string;
}

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Timeframe {
  value: string;
  label: string;
  minutes: number;
}

export interface RefreshInterval {
  value: number;
  label: string;
}

export interface RSIData {
  time: number;
  value: number;
}

export interface VolumeProfileData {
  price: number;
  volume: number;
}

export interface Divergence {
  type: 'bullish' | 'bearish';
  startTime: number;
  endTime: number;
  priceStart: number;
  priceEnd: number;
  rsiStart: number;
  rsiEnd: number;
}

export interface LeverageCalculation {
  investment: number;
  entryPrice: number;
  leverage: number;
  targetPrice: number;
  days: number;
  positionType: 'long' | 'short';
  liquidationPrice: number;
  potentialProfit: number;
  potentialLoss: number;
  openingFee: number;
  closingFee: number;
  fundingFees: number;
  totalFees: number;
  netProfit: number;
  roi: number;
}

export interface OrderSetup {
  pair: TradingPair;
  orderType: 'long' | 'short';
  currentPrice: number;
  capital: number;
  riskPercentage: number;
  rewardRiskRatio: number;
  suggestedLeverage: number;
  positionSize: number;
  stopLoss: number;
  takeProfit: number;
  liquidationPrice: number;
  potentialGain: number;
  potentialGainPercent: number;
  maxLoss: number;
  maxLossPercent: number;
}

export interface TechnicalIndicators {
  rsi: boolean;
  frvpLongTerm: boolean;
  frvpShortTerm: boolean;
  divergences: boolean;
}

export interface ChartSettings {
  pair: TradingPair;
  timeframe: Timeframe;
  refreshInterval: RefreshInterval;
  indicators: TechnicalIndicators;
  frvpLongTermPeriod: number;
  frvpShortTermPeriod: number;
}

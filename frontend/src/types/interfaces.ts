// General API response interface
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

// Transaction-related interfaces
export interface TransactionRequest {
  user_id: number;
  ticker: string;
  quantity: number;
  transaction_type: 'buy' | 'sell';
  price?: number;
}

export interface TransactionResponse {
  transaction_id: number;
  status: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  ticker: string;
  transaction_type: 'buy' | 'sell';
  quantity: number;
  price: number;
  total_cost: number;
  timestamp: string; // ISO date string
}

// User-related interfaces
export interface User {
  id: number;
  username: string;
  email?: string;
  budget: number;
  portfolioValue?: number;
  portfolio?: Stock[];
  created_at?: string;
  updated_at?: string;
}

export interface UserResponse {
  user_id: number;
  username: string;
}

// Portfolio and Performance-related interfaces
export interface PortfolioData {
  portfolio: Stock[];
  total_portfolio_value: number;
  historical_values?: { date: string; value: number }[]; // Optional for line chart
}

export interface StockPerformance {
  ticker: string;
  quantity: number;
  purchase_price: number;
  current_price: number;
  investment: number;
  current_value: number;
  individual_roi: number;
}

export interface PerformanceResponse {
  total_investment: number;
  total_current_value: number;
  roi: number;
  details: StockPerformance[];
}

// Budget-related interface
export interface BudgetResponse {
  budget: number;
  new_budget?: number;
}

// Individual Stock interface
export interface Stock {
  id?: number;
  ticker: string;
  quantity: number;
  purchase_price: number;
  total_cost?: number;
  current_price?: number | null;
  current_value?: number | null;
  performance?: number;
  last_updated?: string;
}

// Company and Financial Data
export interface CompanyInfo {
  name: string;
  ticker: string;
  industry: string;
  description: string;
  currentPrice: number;
  marketCap: number;
  peRatio: number;
  eps: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  dividendYield: number;
  priceToBook: number;
}

export interface FinancialData {
  peRatio: number;
  eps: number;
  marketCap: number;
  dividendYield: number;
  // Add more financial fields as needed
}

export interface PortfolioAnalysisResponse {
  weights: PortfolioWeight[];
  sectors: SectorDistribution[];
  sp500_comparison: SP500Comparison;
  suggestions: string[];
}

export interface PortfolioWeight {
  ticker: string;
  weight: number;
}

export interface SectorDistribution {
  sector: string;
  percentage: number;
}

export interface SP500Comparison {
  portfolio_return: number;
  sp500_return: number;
}


// Portfolio Trend
export interface PortfolioTrendEntry {
  date: string; // ISO date string
  portfolio_value: number;
  daily_return?: number | null;
}

export interface PortfolioTrendResponse {
  message: string;
  user_id: number;
  trend: PortfolioTrendEntry[];
}

// Stock Price Data
export interface StockPriceData {
  date: string; // ISO date string
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Trade-related interfaces
export interface Trade {
  id: number;
  timestamp: string; // ISO date string
  action: string;
  ticker: string;
  price: number;
  quantity: number;
  profit_loss: number;
  budget: number;
}

export interface TradesResponse {
  total: number;
  trades: Trade[];
}

export interface TradeSummary {
  total_trades: number;
  total_realized_profit: number;
  budget_used: number;
  last_24h_profit: number;
}

// Menu Item (UI-related)
export interface MenuItem {
  text: string;
  icon: React.ReactElement;
  path?: string;
  action?: () => void;
}

// Authentication
export interface UserLogin {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  userId?: number;
  expiresIn?: number;
}

export interface UserRegistration {
  username: string;
  password: string;
  budget: number;
  email?: string;
}

export interface UserProfileResponse {
  user: User;
}

export type ChatMessage = {
  sender: "user" | "bot";
  content: string;
};

export interface ChatResponse {
  sender: "bot";
  content: string;
}
// src/types/interfaces.ts

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
  timestamp: string;
}

// User-related interfaces
export interface PortfolioItem {
  ticker: string;
  quantity: number;
  purchase_price: number;
}

export interface User {
  id: number;
  username: string;
  budget: number;
  portfolioValue: number;
  portfolio: PortfolioItem[]; // Add portfolio field for user's stocks
}

export interface UserResponse {
  user_id: number;
  username: string;
}

// Portfolio and Performance-related interfaces
export interface PortfolioData {
  portfolio: Array<{
    ticker: string;
    quantity: number;
    purchase_price: number;
    total_cost: number;
    current_price: number | null;
    current_value: number | null;
  }>;
  total_portfolio_value: number;
  historical_values?: { date: string; value: number }[]; // Optional for line chart
}

export interface PortfolioPerformance {
  total_investment: number;
  total_current_value: number;
  roi: number;
  details: Array<{
    ticker: string;
    quantity: number;
    purchase_price: number;
    current_price: number;
    investment: number;
    current_value: number;
    individual_roi: number;
  }>;
}

// Budget-related interface
export interface BudgetResponse {
  budget: number;
  new_budget?: number;
}

// Individual Stock details
export interface Stock {
  id: number;
  ticker: string;
  quantity: number;
  purchase_price: number;
  current_price: number | null;
  current_value: number | null;
  performance?: number;
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

export interface CompanyInfo {
  name: string;
  ticker: string;
  industry: string;
  description: string;
  currentPrice: number;
  marketCap: number;
  peRatio: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  dividendYield: number;
  priceToBook: number;
  historicalPrices: {
    dates: string[];
    prices: number[];
  };
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

export interface PortfolioAnalysisResponse {
  weights: PortfolioWeight[];
  sectors: SectorDistribution[];
  sp500_comparison: SP500Comparison;
  suggestions: string[];
}

export interface Trade {
  id: number;
  timestamp: string;
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



interface MenuItem {
  text: string;
  icon: React.ReactElement;
  path?: string;
  action?: () => void;
}



export interface UserLogin {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  userId?: number;  
  expiresIn?: number;  
}



export interface Stock {
  ticker: string;
  quantity: number;
  purchase_price: number;
  total_cost: number;
  current_price: number | null;
  current_value: number | null;
  last_updated?: string; 
}

export interface PortfolioResponse {
  portfolio: Stock[];
  total_portfolio_value: number;
  last_calculated?: string; // Optional: timestamp of the portfolio's last valuation
}


export interface User {
  id: number;
  username: string;
  email?: string;         // Optional, if your app collects email addresses
  budget: number;         // User's available budget
  created_at?: string;    // Optional, timestamp of user account creation
  updated_at?: string;    // Optional, timestamp of last profile update
}

export interface UserRegistration {
  username: string;
  password: string;
  budget: number;
  email?: string;         // Optional, if applicable
}

export interface UserProfileResponse {
  user: User;
}


export interface PortfolioTrendEntry {
  date: string; // Ensure it's compatible with the backend's date format
  portfolio_value: number;
  daily_return?: number | null;
}

export interface PortfolioTrendResponse {
  message: string;
  user_id: number;
  trend: PortfolioTrendEntry[];
}

// src/api/api.ts

import axios from 'axios';
import * as Interfaces from './types/interfaces';

const API_BASE_URL = 'https://sarunaskarpovicius.site/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const handleError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    console.error('API request failed:', error.response?.data || error.message);
    return { success: false, data: null, error: error.response?.data || 'An unknown error occurred' };
  }
  console.error('Unexpected error:', error);
  return { success: false, data: null, error: 'An unexpected error occurred' };
};

// User-related functions
export const registerUser = async (
  username: string,
  password: string,
  budget: number
): Promise<Interfaces.ApiResponse<Interfaces.UserResponse>> => {
  try {
    const response = await axiosInstance.post<Interfaces.UserResponse>('/users/register', { 
      username, 
      password, 
      budget 
    });

    if (response.data?.user_id) {
      localStorage.setItem('username', username);
      localStorage.setItem('user_id', response.data.user_id.toString());
    }

    return { success: true, data: response.data, error: null };
  } catch (error) {
    return handleError(error);
  }
};

export const loginUser = async (
  username: string, 
  password: string
): Promise<Interfaces.ApiResponse<Interfaces.UserResponse>> => {
  try {
    const response = await axiosInstance.post<Interfaces.UserResponse>('/users/login', { 
      username, 
      password 
    });

    if (response.data?.user_id) {
      localStorage.setItem('username', username);
      localStorage.setItem('user_id', response.data.user_id.toString());
    }

    return { success: true, data: response.data, error: null };
  } catch (error) {
    return handleError(error);
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await axiosInstance.post('/users/logout');
    localStorage.removeItem('username');
    localStorage.removeItem('user_id');
  } catch (error) {
    console.error("Logout failed:", error);
    throw error;
  }
};

// Portfolio functions
export const viewPortfolio = async (userId: number): Promise<Interfaces.ApiResponse<Interfaces.PortfolioData>> => {
  try {
    const response = await axiosInstance.get<Interfaces.PortfolioData>(`/portfolio/${userId}`);
    return { success: true, data: response.data, error: null };
  } catch (error) {
    return handleError(error);
  }
};

export const fetchPortfolioPerformance = async (
  portfolio: Interfaces.PortfolioItem[]
): Promise<Interfaces.ApiResponse<Interfaces.PerformanceResponse>> => {
  try {
    // Send portfolio directly as an array instead of wrapping in an object
    const response = await axiosInstance.post<Interfaces.PerformanceResponse>('/performance', portfolio);
    return { success: true, data: response.data, error: null };
  } catch (error) {
    return handleError(error);
  }
};


// Stock transaction functions
export const buyStock = async (
  userId: number,
  ticker: string, 
  quantity: number
): Promise<Interfaces.ApiResponse<Interfaces.TransactionResponse>> => {
  try {
    const transaction: Interfaces.TransactionRequest = {
      user_id: userId,
      ticker,
      quantity,
      transaction_type: 'buy',
      price: 0
    };
    
    const response = await axiosInstance.post<Interfaces.TransactionResponse>('/transactions/buy', transaction);
    return { success: true, data: response.data, error: null };
  } catch (error) {
    return handleError(error);
  }
};

export const sellStock = async (
  userId: number,
  ticker: string, 
  quantity: number
): Promise<Interfaces.ApiResponse<Interfaces.TransactionResponse>> => {
  try {
    const transaction: Interfaces.TransactionRequest = {
      user_id: userId,
      ticker,
      quantity,
      transaction_type: 'sell'
    };
    
    const response = await axiosInstance.post<Interfaces.TransactionResponse>('/transactions/sell', transaction);
    return { success: true, data: response.data, error: null };
  } catch (error) {
    return handleError(error);
  }
};

export const getTransactions = async (
  userId: number
): Promise<Interfaces.ApiResponse<Interfaces.Transaction[]>> => {
  try {
    const response = await axiosInstance.get<Interfaces.Transaction[]>(`/transactions/${userId}`);
    return { success: true, data: response.data, error: null };
  } catch (error) {
    return handleError(error);
  }
};

// Budget-related functions
export const viewBudget = async (
  userId: number
): Promise<Interfaces.ApiResponse<Interfaces.BudgetResponse>> => {
  try {
    const response = await axiosInstance.get<Interfaces.BudgetResponse>('/users/budget', {
      params: { user_id: userId }
    });
    return { success: true, data: response.data, error: null };
  } catch (error) {
    return handleError(error);
  }
};

export const updateBudget = async (
  userId: number,
  newBudget: number
): Promise<Interfaces.ApiResponse<Interfaces.BudgetResponse>> => {
  try {
    const response = await axiosInstance.put<Interfaces.BudgetResponse>(
      '/users/budget',
      { new_budget: newBudget }, // Body
      { params: { user_id: userId } } // Query parameters
    );
    return { success: true, data: response.data, error: null };
  } catch (error) {
    return handleError(error);
  }
};

// General helper function to fetch company info
export const fetchCompanyInfo = async (query: string): Promise<Interfaces.ApiResponse<Interfaces.CompanyInfo>> => {
  try {
    const response = await axiosInstance.get(`/market/company/${query}`);
    return { success: true, data: response.data, error: null };
  } catch (error) {
    return handleError(error);
  }
};

export const fetchFearGreedIndex = async () => {
  try {
    const response = await axios.get('/api/market/fear-greed');
    return response.data;
  } catch (error) {
    console.error('Error fetching Fear & Greed Index:', error);
    throw new Error('Failed to fetch Fear & Greed Index data');
  }
};

export const fetchPortfolioAnalysis = async (userId: number): Promise<Interfaces.PortfolioAnalysisResponse> => {
  try {
      const response = await axios.get<Interfaces.PortfolioAnalysisResponse>(`/api/portfolio/analyze/${userId}`);
      return response.data;
  } catch (error) {
      console.error("Failed to fetch portfolio analysis:", error);
      throw error;
  }
};


// ==================== TRADING BOT ====================
// Fetch the list of trades
export const fetchTrades = async (
  limit: number,
  offset: number
): Promise<Interfaces.ApiResponse<Interfaces.TradesResponse>> => {
  try {
    const response = await axiosInstance.get<Interfaces.TradesResponse>('/trades', {
      params: { limit, offset },
    });
    return { success: true, data: response.data, error: null };
  } catch (error) {
    return handleError(error);
  }
};

// Fetch trade summary
export const fetchTradeSummary = async (): Promise<Interfaces.ApiResponse<Interfaces.TradeSummary>> => {
  try {
    const response = await axiosInstance.get<Interfaces.TradeSummary>('/trades/summary');
    return { success: true, data: response.data, error: null };
  } catch (error) {
    return handleError(error);
  }
};  



export default axiosInstance;

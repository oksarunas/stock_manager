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
  portfolio: Interfaces.Stock[]
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
export const addStock = async (
  userId: number,
  ticker: string,
  quantity: number,
  purchasePrice: number
): Promise<Interfaces.ApiResponse<Interfaces.TransactionResponse>> => {
  try {
    const stock: Interfaces.TransactionRequest = {
      user_id: userId,
      ticker,
      quantity,
      transaction_type: 'buy',
      price: purchasePrice,
    };

    const response = await axiosInstance.post<Interfaces.TransactionResponse>('/transactions/add', stock);
    return { success: true, data: response.data, error: null };
  } catch (error) {
    return handleError(error);
  }
};


export const removeStock = async (
  userId: number,
  ticker: string,
  quantity: number,
  price: number // Added price
): Promise<Interfaces.ApiResponse<Interfaces.TransactionResponse>> => {
  try {
    const stock: Interfaces.TransactionRequest = {
      user_id: userId,
      ticker,
      quantity,
      transaction_type: "sell",
      price, // Include price in the payload
    };

    const response = await axiosInstance.post<Interfaces.TransactionResponse>(
      "/transactions/remove",
      stock
    );
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

export const fetchFearGreedIndex = async (): Promise<{ date: string; value: number }[]> => {
  try {
    const response = await fetch("/api/market/fear-greed/history");
    const contentType = response.headers.get("content-type");

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    if (!contentType || !contentType.includes("application/json")) {
      throw new Error(`Invalid content type: ${contentType}`);
    }

    const data = await response.json(); // Parse the JSON
    console.log("Fetched data: ", data); // Log fetched data

    if (!data.trend || !Array.isArray(data.trend)) {
      throw new Error("Invalid data structure received.");
    }

    return data.trend; // Return only the `trend` array
  } catch (error) {
    console.error("Error fetching Fear & Greed Index:", error);
    throw error;
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


export const fetchPortfolioTrend = async (userId: number): Promise<Interfaces.PortfolioTrendResponse> => {
  try {
    const response = await axios.get<Interfaces.PortfolioTrendResponse>(`/api/portfolio/trend/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch portfolio trend:', error);
    throw error;
  }
};


export const fetchHistoricalPrices = async (
  ticker: string,
  range: string = "1mo" // Default range to 1 month
): Promise<Interfaces.ApiResponse<Interfaces.StockPriceData[]>> => {
  try {
    const response = await axiosInstance.get<Interfaces.ApiResponse<Interfaces.StockPriceData[]>>(
      `/market/historical/${ticker}`,
      { params: { range } } // Send the time range as a query parameter
    );
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

export default axiosInstance;

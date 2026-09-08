import { ApiResponse } from '../types';

// Centralized API configuration
const DEFAULT_API_ENDPOINT = '/api';

export function getApiUrl(): string {
  // Check if custom URL was set in environment variable or localStorage
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().startsWith('http')) {
    return envUrl.trim();
  }
  const customUrl = localStorage.getItem('dairypulse_custom_api_url');
  if (customUrl && customUrl.trim().startsWith('http')) {
    return customUrl.trim();
  }
  return DEFAULT_API_ENDPOINT;
}

export function setCustomApiUrl(url: string | null): void {
  if (url && url.trim().startsWith('http')) {
    localStorage.setItem('dairypulse_custom_api_url', url.trim());
  } else {
    localStorage.removeItem('dairypulse_custom_api_url');
  }
}

/**
 * Main API request dispatcher with safe JSON parsing and offline resilience
 */
export async function apiRequest<T = any>(
  action: string,
  data: Record<string, any> = {},
  sessionToken?: string | null
): Promise<ApiResponse<T>> {
  const url = getApiUrl();

  const token = sessionToken || localStorage.getItem('dairypulse_session_token');

  const payload: Record<string, any> = {
    action,
    data,
  };

  if (token) {
    payload.sessionToken = token;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const rawText = await response.text();
    let result: any = null;

    if (rawText && rawText.trim()) {
      try {
        result = JSON.parse(rawText);
      } catch (parseErr) {
        console.warn(`Non-JSON response from server for [${action}]:`, rawText.slice(0, 150));
      }
    }

    if (result && typeof result === 'object') {
      return result as ApiResponse<T>;
    }

    // If server responded with error status or empty body
    if (!response.ok) {
      return {
        success: false,
        message: `Server returned HTTP ${response.status} (${response.statusText || 'Error'}).`,
      };
    }

    return {
      success: false,
      message: 'Server returned an empty or invalid response.',
    };
  } catch (error: any) {
    console.error(`API request failed [${action}]:`, error);
    return {
      success: false,
      message: error?.message || 'We couldn’t connect to the farm server. Please check your connection.',
    };
  }
}

// Typed API Helpers
export const api = {
  // Auth
  signup: (fullName: string, email: string, password: string) =>
    apiRequest('signup', { fullName, email, password }),

  login: (email: string, password: string) =>
    apiRequest('login', { email, password }),

  logout: (token?: string) =>
    apiRequest('logout', {}, token),

  validateSession: (token: string) =>
    apiRequest('validateSession', {}, token),

  getCurrentUser: () =>
    apiRequest('getCurrentUser'),

  // Farm
  getFarm: () =>
    apiRequest('getFarm'),

  createFarm: (farmName: string, location: string, mainMilkBuyer?: string, farmPhotoUrl?: string) =>
    apiRequest('createFarm', { farmName, location, mainMilkBuyer, farmPhotoUrl }),

  updateFarm: (data: { farmName?: string; location?: string; mainMilkBuyer?: string; farmPhotoUrl?: string }) =>
    apiRequest('updateFarm', data),

  // Cows
  getCows: () =>
    apiRequest('getCows'),

  createCow: (data: {
    cowNumber: string;
    name?: string;
    breed: string;
    dateOfBirth?: string;
    status: string;
    notes?: string;
  }) => apiRequest('createCow', data),

  updateCow: (data: {
    cowId: string;
    cowNumber?: string;
    name?: string;
    breed?: string;
    dateOfBirth?: string;
    status?: string;
    notes?: string;
  }) => apiRequest('updateCow', data),

  deleteCow: (cowId: string) =>
    apiRequest('deleteCow', { cowId }),

  // Milk
  getMilkRecords: () =>
    apiRequest('getMilkRecords'),

  createMilkRecord: (data: {
    recordDate: string;
    morningLitres: number;
    eveningLitres: number;
    notes?: string;
  }) => apiRequest('createMilkRecord', data),

  updateMilkRecord: (data: {
    recordId: string;
    recordDate?: string;
    morningLitres?: number;
    eveningLitres?: number;
    notes?: string;
  }) => apiRequest('updateMilkRecord', data),

  deleteMilkRecord: (recordId: string) =>
    apiRequest('deleteMilkRecord', { recordId }),

  // Expenses
  getExpenses: () =>
    apiRequest('getExpenses'),

  createExpense: (data: {
    expenseDate: string;
    category: string;
    description: string;
    amount: number;
    notes?: string;
  }) => apiRequest('createExpense', data),

  updateExpense: (data: {
    expenseId: string;
    expenseDate?: string;
    category?: string;
    description?: string;
    amount?: number;
    notes?: string;
  }) => apiRequest('updateExpense', data),

  deleteExpense: (expenseId: string) =>
    apiRequest('deleteExpense', { expenseId }),

  // Buyers
  getBuyers: () =>
    apiRequest('getBuyers'),

  createBuyer: (data: { name: string; phone?: string; location?: string }) =>
    apiRequest('createBuyer', data),

  updateBuyer: (data: { buyerId: string; name?: string; phone?: string; location?: string }) =>
    apiRequest('updateBuyer', data),

  deleteBuyer: (buyerId: string) =>
    apiRequest('deleteBuyer', { buyerId }),

  // Sales
  getSales: () =>
    apiRequest('getSales'),

  createSale: (data: {
    buyerId?: string;
    saleDate: string;
    litres: number;
    pricePerLitre: number;
    amountPaid?: number;
    notes?: string;
  }) => apiRequest('createSale', data),

  updateSale: (data: {
    saleId: string;
    buyerId?: string;
    saleDate?: string;
    litres?: number;
    pricePerLitre?: number;
    amountPaid?: number;
    notes?: string;
  }) => apiRequest('updateSale', data),

  deleteSale: (saleId: string) =>
    apiRequest('deleteSale', { saleId }),

  // Intelligence
  getDashboardData: () =>
    apiRequest('getDashboardData'),

  getReportData: (period: string = 'this_month') =>
    apiRequest('getReportData', { period }),
};

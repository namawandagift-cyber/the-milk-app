export type CowStatus = 'Lactating' | 'Dry' | 'Pregnant' | 'Calf' | 'Sold' | 'Sick' | 'Other';

export type ExpenseCategory =
  | 'Feed'
  | 'Veterinary'
  | 'Labour'
  | 'Transport'
  | 'Utilities'
  | 'Equipment'
  | 'Medication'
  | 'Maintenance'
  | 'Other';

export type FarmPulseStatus = 'getting_started' | 'steady' | 'watch' | 'attention';

export interface User {
  userId: string;
  fullName: string;
  email: string;
  farmId: string | null;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive';
}

export interface Farm {
  farmId: string;
  ownerId: string;
  farmName: string;
  location: string;
  farmPhotoUrl?: string;
  cowCount: number;
  mainMilkBuyer?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Cow {
  cowId: string;
  farmId: string;
  cowNumber: string;
  name: string;
  breed: string;
  dateOfBirth: string;
  status: CowStatus;
  photoUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MilkRecord {
  recordId: string;
  farmId: string;
  recordDate: string;
  morningLitres: number;
  eveningLitres: number;
  totalLitres: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  expenseId: string;
  farmId: string;
  expenseDate: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Buyer {
  buyerId: string;
  farmId: string;
  name: string;
  phone: string;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  saleId: string;
  farmId: string;
  buyerId: string;
  buyerName?: string;
  saleDate: string;
  litres: number;
  pricePerLitre: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  activityId: string;
  farmId: string;
  userId: string;
  action: string;
  description: string;
  timestamp: string;
}

export interface FarmPulse {
  status: FarmPulseStatus;
  title: string;
  message: string;
  actionHint?: string;
}

export interface DashboardAlert {
  id: string;
  type: 'warning' | 'info' | 'critical';
  title: string;
  message: string;
  linkTo?: string;
  linkText?: string;
}

export interface DailyMilkChartPoint {
  date: string;
  label: string;
  morningLitres: number;
  eveningLitres: number;
  totalLitres: number;
}

export interface ExpenseCategoryShare {
  category: ExpenseCategory;
  amount: number;
  percentage: number;
}

export interface DashboardData {
  farm: Farm | null;
  todayMilk: number;
  todayRevenue: number;
  todayExpenses: number;
  estimatedMargin: number;
  cowCount: number;
  weeklyMilk: number;
  previousWeeklyMilk: number;
  productionChangePct: number | null;
  outstandingPayments: number;
  farmPulse: FarmPulse;
  alerts: DashboardAlert[];
  recentActivity: Activity[];
  dailyMilkTrend: DailyMilkChartPoint[];
  expenseBreakdown: ExpenseCategoryShare[];
  financesComparison: {
    period: string;
    revenue: number;
    expenses: number;
    margin: number;
  }[];
  totalRecordsCount: {
    milk: number;
    cows: number;
    expenses: number;
    sales: number;
  };
}

export interface ReportData {
  period: string;
  startDate: string;
  endDate: string;
  summary: {
    milkChangePct: number | null;
    revenueChangePct: number | null;
    expensesChangePct: number | null;
    marginChangeAmount: number | null;
  };
  production: {
    totalLitres: number;
    averageDailyLitres: number;
    bestDay: { date: string; litres: number } | null;
    lowestDay: { date: string; litres: number } | null;
    dailyData: DailyMilkChartPoint[];
  };
  financial: {
    revenue: number;
    expenses: number;
    estimatedMargin: number;
    costPerLitre: number | null;
    outstandingPayments: number;
    expensesByCategory: ExpenseCategoryShare[];
    salesByBuyer: { buyerName: string; litres: number; amount: number }[];
  };
  farmPerformance: {
    totalCows: number;
    lactatingCows: number;
    litresPerLactatingCow: number | null;
  };
  hasSufficientData: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  sessionToken?: string;
}

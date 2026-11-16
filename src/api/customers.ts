import { apiGet, apiGetPaginated, apiPost, apiPatch } from "./client";
import { ApiCustomer, ApiSuspensionAppeal } from "./types";

export interface ListCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
  suspended?: boolean;
}

function toQueryString(params?: ListCustomersParams): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(([, v]) => v !== undefined) as [string, string | number | boolean][];
  if (entries.length === 0) return "";
  const search = new URLSearchParams(entries.map(([k, v]) => [k, String(v)]));
  return `?${search.toString()}`;
}

export async function listCustomers(storeId: string, params?: ListCustomersParams) {
  return apiGetPaginated<ApiCustomer[]>(`/stores/${storeId}/customers${toQueryString(params)}`);
}

export function getCustomer(storeId: string, userId: string): Promise<ApiCustomer> {
  return apiGet<ApiCustomer>(`/stores/${storeId}/customers/${userId}`);
}

export interface RegisterCustomerBody {
  name: string;
  phone?: string;
}

export function registerCustomer(storeId: string, body: RegisterCustomerBody): Promise<ApiCustomer> {
  return apiPost<ApiCustomer>(`/stores/${storeId}/customers`, body);
}

export function suspendCustomer(storeId: string, userId: string, reason?: string): Promise<ApiCustomer> {
  return apiPost<ApiCustomer>(`/stores/${storeId}/customers/${userId}/suspend`, { reason });
}

export function activateCustomer(storeId: string, userId: string): Promise<ApiCustomer> {
  return apiPost<ApiCustomer>(`/stores/${storeId}/customers/${userId}/activate`);
}

// Self-service — called by a signed-up user (not an admin) to join a
// store's customer directory, e.g. right after picking their gaming zone
// during signup. Requires the user's own token to already be set.
export function joinStoreAsCustomer(storeId: string): Promise<ApiCustomer> {
  return apiPost<ApiCustomer>(`/stores/${storeId}/customers/join`);
}

// Public — the whole "I'm a customer" signup path in one call: creates the
// login and links it to the chosen store's customer directory. No token
// needed before or after; this app has no customer session to hold.
export interface CustomerSignupBody {
  name: string;
  username: string;
  email?: string;
  password: string;
  phone?: string;
}

export function signupAsCustomer(storeId: string, body: CustomerSignupBody): Promise<ApiCustomer> {
  return apiPost<ApiCustomer>(`/stores/${storeId}/customers/signup`, body);
}

export function listSuspensionAppeals(storeId: string): Promise<ApiSuspensionAppeal[]> {
  return apiGet<ApiSuspensionAppeal[]>(`/stores/${storeId}/customers/appeals`);
}

export function resolveSuspensionAppeal(
  storeId: string,
  appealId: string,
  decision: "approved" | "rejected",
  response?: string
): Promise<{ success: boolean; appealStatus: string; isSuspended: boolean }> {
  return apiPost(`/stores/${storeId}/customers/appeals/${appealId}/resolve`, { decision, response });
}

export function getSuspensionStatus(storeId: string): Promise<{
  isSuspended: boolean;
  reason: string | null;
  suspendedAt: string | null;
  appealText: string | null;
  appealStatus: string | null;
  appealedAt: string | null;
  appealResponse: string | null;
}> {
  return apiGet(`/stores/${storeId}/customers/suspension-status`);
}

export function submitSuspensionAppeal(storeId: string, appealText: string): Promise<{ success: boolean; message: string }> {
  return apiPost(`/stores/${storeId}/customers/appeal`, { appealText });
}

export interface ApiCustomerDetails {
  customer: ApiCustomer & {
    activeGamepassMinutes: number;
  };
  sessions: Array<{
    id: string;
    systemId: string;
    systemName: string;
    startedAt: string;
    endedAt: string | null;
    durationMinutes: number | null;
    status: string;
    billedAmount: string;
    unpaidAmount: string;
  }>;
  payments: Array<{
    id: string;
    amount: string;
    paymentMethod: string;
    status: string;
    utrReference: string | null;
    createdAt: string;
    reviewedAt: string | null;
  }>;
  gamepasses: Array<{
    id: string;
    packageName: string;
    totalAmount: string;
    orderStatus: string;
    paymentMethod: string;
    remainingMinutes: number | null;
    redemptionStatus: string | null;
    expiresAt: string | null;
    createdAt: string;
  }>;
  creditTransactions: Array<{
    id: string;
    transactionType: string;
    amount: string;
    balanceAfter: string;
    description: string | null;
    createdAt: string;
  }>;
  payLater?: {
    totalPayLaterDebt: number;
    oldestUnpaidPayLaterDate: string | null;
    payLaterDueDate: string | null;
    isPayLaterOverdue: boolean;
    daysRemainingUntilDue: number | null;
    isPayLaterBlocked: boolean;
    requestsToday: number;
    maxRequestsPerDay: number;
    canUsePayLater: boolean;
  };
}

export function getCustomerDetails(storeId: string, userId: string): Promise<ApiCustomerDetails> {
  return apiGet<ApiCustomerDetails>(`/stores/${storeId}/customers/${userId}`);
}

export function resetCustomerPassword(
  storeId: string,
  userId: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  return apiPost(`/stores/${storeId}/customers/${userId}/reset-password`, { newPassword });
}

export interface ApiPayLaterData {
  pendingAllowed: Array<{
    id: string;
    type: "topup" | "gamepass";
    amount: string;
    customerName: string;
    userId: string;
    createdAt: string;
    utrReference?: string | null;
  }>;
  customerSummary: Array<{
    userId: string;
    name: string;
    email: string | null;
    phone: string | null;
    totalDebt: number;
    unpaidCount: number;
    oldestUnpaidDate: string;
    dueDate: string;
    isOverdue: boolean;
    daysRemaining: number;
  }>;
  history: Array<{
    id: string;
    type: "topup" | "gamepass";
    amount: string;
    customerName: string;
    userId: string;
    status: string;
    createdAt: string;
    confirmedAt: string | null;
  }>;
  settings?: {
    maxRequestsPerDay: number;
    maxAmountPerRequest: number;
    maxOutstandingBalance: number;
    repaymentWindowDays: number;
  };
  limits?: {
    maxRequestsPerDay: number;
    maxAmountPerRequest: number;
    maxOutstandingBalance: number;
    repaymentWindowDays: number;
  };
  pending?: any[];
  debtors?: any[];
}

export function getPayLaterData(storeId: string): Promise<ApiPayLaterData> {
  return apiGet<ApiPayLaterData>(`/stores/${storeId}/pay-later`);
}

export function updatePaymentSettings(
  storeId: string,
  settings: {
    pay_later_max_requests_per_day?: number;
    pay_later_max_amount_per_request?: number;
    pay_later_max_outstanding_balance?: number;
    pay_later_repayment_window_days?: number;
  }
): Promise<{ success: boolean; payments: any }> {
  return apiPatch(`/stores/${storeId}/payment-settings`, settings);
}

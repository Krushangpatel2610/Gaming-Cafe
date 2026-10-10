import { apiDelete, apiGet, apiPatch, apiPost, apiPostFormData } from "./client";

export interface ApiBeverage {
  id: string;
  storeId: string;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  stockQty: number | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  inStock?: boolean;
}

export interface ApiBeverageOrderItem {
  id: string;
  orderId: string;
  beverageId: string | null;
  name: string;
  unitPrice: string;
  quantity: number;
  createdAt: string;
}

export interface ApiBeverageOrder {
  id: string;
  storeId: string;
  userId: string;
  systemId: string | null;
  totalAmount: string;
  paymentMethod: "credits" | "upi" | "cash" | "split";
  cashAmount: string;
  upiAmount: string;
  status: "pending_payment" | "paid" | "delivered" | "rejected" | "cancelled";
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  cashConfirmedBy: string | null;
  cashConfirmedAt: string | null;
  upiConfirmedBy: string | null;
  upiConfirmedAt: string | null;
  deliveredBy: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    username: string | null;
  };
  system?: {
    id: string;
    name: string;
    stationNumber: number;
  };
  items?: ApiBeverageOrderItem[];
}

export interface CreateBeverageBody {
  name: string;
  description?: string;
  price: number;
  stockQty?: number | null;
  imageUrl?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateBeverageBody {
  name?: string;
  description?: string;
  price?: number;
  stockQty?: number | null;
  imageUrl?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export function listBeverages(storeId: string): Promise<ApiBeverage[]> {
  return apiGet<ApiBeverage[]>(`/stores/${storeId}/beverages`);
}

export function createBeverage(storeId: string, body: CreateBeverageBody): Promise<ApiBeverage> {
  return apiPost<ApiBeverage>(`/stores/${storeId}/beverages`, body);
}

export function updateBeverage(storeId: string, id: string, body: UpdateBeverageBody): Promise<ApiBeverage> {
  return apiPatch<ApiBeverage>(`/stores/${storeId}/beverages/${id}`, body);
}

export function adjustBeverageStock(storeId: string, id: string, stockQty: number | null): Promise<ApiBeverage> {
  return apiPatch<ApiBeverage>(`/stores/${storeId}/beverages/${id}/stock`, { stockQty });
}

export function deleteBeverage(storeId: string, id: string): Promise<null> {
  return apiDelete(`/stores/${storeId}/beverages/${id}`);
}

export function uploadBeverageImage(storeId: string, id: string, file: File): Promise<ApiBeverage> {
  const formData = new FormData();
  formData.append("file", file);
  return apiPostFormData<ApiBeverage>(`/stores/${storeId}/beverages/${id}/image`, formData);
}

export function listBeverageOrders(storeId: string, status?: string): Promise<ApiBeverageOrder[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiGet<ApiBeverageOrder[]>(`/stores/${storeId}/beverage-orders${query}`);
}

export function confirmBeverageOrder(storeId: string, id: string, line?: "cash" | "upi" | "all"): Promise<ApiBeverageOrder> {
  return apiPost<ApiBeverageOrder>(`/stores/${storeId}/beverage-orders/${id}/confirm`, { line });
}

export function rejectBeverageOrder(storeId: string, id: string, reason: string): Promise<ApiBeverageOrder> {
  return apiPost<ApiBeverageOrder>(`/stores/${storeId}/beverage-orders/${id}/reject`, { reason });
}

export function deliverBeverageOrder(storeId: string, id: string): Promise<ApiBeverageOrder> {
  return apiPost<ApiBeverageOrder>(`/stores/${storeId}/beverage-orders/${id}/deliver`);
}

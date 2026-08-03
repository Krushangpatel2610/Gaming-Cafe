import { apiPost } from "./client";
import { ApiBooking } from "./types";

export interface WalkInBookingBody {
  systemId: string;
  userId?: string;
  walkInPhone?: string;
  notes?: string;
}

export function createWalkInBooking(storeId: string, body: WalkInBookingBody): Promise<ApiBooking> {
  return apiPost<ApiBooking>(`/stores/${storeId}/bookings/walk-in`, body);
}

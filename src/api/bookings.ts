import { apiGet, apiGetPaginated, apiPatch, apiPost } from "./client";
import { ApiAvailabilityResult, ApiBooking, ApiBookingStatus } from "./types";

function toQueryString(params?: object): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(([, v]) => v !== undefined) as [string, string | number][];
  if (entries.length === 0) return "";
  return `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()}`;
}

export interface WalkInBookingBody {
  systemId: string;
  userId?: string;
  walkInPhone?: string;
  notes?: string;
}

export function createWalkInBooking(storeId: string, body: WalkInBookingBody): Promise<ApiBooking> {
  return apiPost<ApiBooking>(`/stores/${storeId}/bookings/walk-in`, body);
}

export interface ListBookingsParams {
  page?: number;
  limit?: number;
  date?: string;
  status?: ApiBookingStatus;
  systemId?: string;
}

export async function listBookings(storeId: string, params?: ListBookingsParams) {
  return apiGetPaginated<ApiBooking[]>(`/stores/${storeId}/bookings${toQueryString(params)}`);
}

export function getBookingDetail(storeId: string, bookingId: string): Promise<{ booking: ApiBooking }> {
  return apiGet(`/stores/${storeId}/bookings/admin/${bookingId}`);
}

export function extendBooking(
  storeId: string,
  bookingId: string,
  scheduledEnd: string
): Promise<{ booking: ApiBooking }> {
  return apiPatch(`/stores/${storeId}/bookings/${bookingId}`, { scheduledEnd });
}

export function checkAvailability(
  storeId: string,
  params: { systemId: string; start: string; end: string }
): Promise<ApiAvailabilityResult> {
  return apiGet(`/stores/${storeId}/bookings/availability${toQueryString(params)}`);
}

export interface CreateBookingBody {
  systemId: string;
  scheduledStart: string;
  scheduledEnd: string;
  notes?: string;
}

export function createBooking(
  storeId: string,
  body: CreateBookingBody
): Promise<{ booking: ApiBooking; expiresAt?: string }> {
  return apiPost(`/stores/${storeId}/bookings`, body);
}

export async function getMyBookings(
  storeId: string,
  params?: { page?: number; limit?: number; status?: string }
) {
  return apiGetPaginated<ApiBooking[]>(`/stores/${storeId}/bookings/my${toQueryString(params)}`);
}

export function payBooking(storeId: string, bookingId: string): Promise<{ booking: ApiBooking }> {
  return apiPost(`/stores/${storeId}/bookings/${bookingId}/pay`);
}

export function cancelBooking(storeId: string, bookingId: string): Promise<{ booking: ApiBooking }> {
  return apiPost(`/stores/${storeId}/bookings/${bookingId}/cancel`);
}

export function checkInBooking(storeId: string, bookingId: string): Promise<{ booking: ApiBooking }> {
  return apiPost(`/stores/${storeId}/bookings/${bookingId}/check-in`);
}


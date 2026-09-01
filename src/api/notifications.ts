import { apiPost } from "./client";
import { ApiNotificationChannel } from "./types";

export interface AdminSendNotificationBody {
  userIds: string[];
  channel: ApiNotificationChannel;
  title: string;
  body: string;
  referenceType?: string;
  referenceId?: string;
  scheduledAt?: string;
}

export function sendNotification(storeId: string, body: AdminSendNotificationBody): Promise<{ sent: number }> {
  return apiPost(`/stores/${storeId}/notifications/admin/send`, body);
}

export interface TopicSendBody {
  topic: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export function sendTopicNotification(storeId: string, body: TopicSendBody): Promise<{ topic: string }> {
  return apiPost(`/stores/${storeId}/notifications/admin/send/topic`, body);
}

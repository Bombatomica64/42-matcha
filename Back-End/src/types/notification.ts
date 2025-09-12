export type NotificationType = "LIKE" | "PROFILE_VIEW" | "MATCH" | "UNLIKE";

export interface NotificationDTO {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: NotificationType;
  read_at: string | null;
  delivered_at: string | null;
  status: "pending" | "sent" | "failed";
  metadata: Record<string, unknown> | null;
  created_at: string;
}

import { Router } from "express";
import { NotificationController } from "@controllers/notification.controller";

const notificationRoutes = () => {
  const router = Router();
  const controller = new NotificationController();

  router.get("/", controller.list);
  router.get("/unread", controller.listUnread);
  router.get("/unread-count", controller.unreadCount);
  router.patch("/:id/read", controller.markRead);
  router.post("/mark-all-read", controller.markAllRead);

  return router;
};

export default notificationRoutes;

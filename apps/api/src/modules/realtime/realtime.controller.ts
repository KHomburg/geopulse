import { Request, Response } from "express";
import MessageService from "../message/message.service";
import NotificationService from "../notification/notification.service";
import { RealtimeService } from "./realtime.service";

export const streamEvents = async (req: Request, res: Response) => {
	const userId = Number(req.id);

	res.setHeader("Content-Type", "text/event-stream");
	res.setHeader("Cache-Control", "no-cache, no-transform");
	res.setHeader("Connection", "keep-alive");
	res.setHeader("X-Accel-Buffering", "no");
	res.flushHeaders?.();

	const unsubscribe = RealtimeService.addSubscriber(userId, res);

	try {
		const [messagesUnread, notificationsUnread] = await Promise.all([
			MessageService.getUnreadCount(userId),
			NotificationService.getUnreadCount(userId)
		]);

		RealtimeService.sendDirect(res, "realtime:init", {
			messagesUnread,
			notificationsUnread
		});
	} catch {
		RealtimeService.sendDirect(res, "realtime:init", {
			messagesUnread: 0,
			notificationsUnread: 0
		});
	}

	const heartbeat = setInterval(() => {
		RealtimeService.ping(res);
	}, 25_000);

	req.on("close", () => {
		clearInterval(heartbeat);
		unsubscribe();
		res.end();
	});
};

import { Response } from "express";

type RealtimeEventName =
	| "realtime:init"
	| "message:new"
	| "message:typing"
	| "messages:unread"
	| "notification:new"
	| "notifications:unread"
	| "room:message:new"
	| "ping";

class RealtimeServiceClass {
	private subscribers = new Map<number, Set<Response>>();

	addSubscriber(userId: number, res: Response) {
		const existing = this.subscribers.get(userId) ?? new Set<Response>();
		existing.add(res);
		this.subscribers.set(userId, existing);

		return () => {
			const current = this.subscribers.get(userId);
			if (!current) return;
			current.delete(res);
			if (current.size === 0) {
				this.subscribers.delete(userId);
			}
		};
	}

	sendToUser<T>(userId: number, event: RealtimeEventName, data: T) {
		const targets = this.subscribers.get(userId);
		if (!targets?.size) return;

		for (const res of targets) {
			this.writeSafe(userId, res, event, data);
		}
	}

	sendToUsers<T>(userIds: number[], event: RealtimeEventName, data: T) {
		for (const userId of [...new Set(userIds)]) {
			this.sendToUser(userId, event, data);
		}
	}

	sendDirect<T>(res: Response, event: RealtimeEventName, data: T) {
		this.writeEvent(res, event, data);
	}

	ping(res: Response) {
		this.writeEvent(res, "ping", { ts: new Date().toISOString() });
	}

	private writeSafe<T>(
		userId: number,
		res: Response,
		event: RealtimeEventName,
		data: T
	) {
		try {
			this.writeEvent(res, event, data);
		} catch {
			const current = this.subscribers.get(userId);
			current?.delete(res);
			if (current?.size === 0) {
				this.subscribers.delete(userId);
			}
		}
	}

	private writeEvent<T>(res: Response, event: RealtimeEventName, data: T) {
		if (res.writableEnded) return;
		res.write(`event: ${event}\n`);
		res.write(`data: ${JSON.stringify(data)}\n\n`);
	}
}

export const RealtimeService = new RealtimeServiceClass();

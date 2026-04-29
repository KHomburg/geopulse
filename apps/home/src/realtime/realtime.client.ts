import axios from "axios";
import { API_BASE } from "../api/client";
import type { Message } from "../api/messages.api";
import type { Notification } from "../api/notifications.api";
import type { RoomMessage } from "../api/rooms.api";

export type RealtimeEvent =
	| {
			type: "realtime:init";
			data: { messagesUnread: number; notificationsUnread: number };
	  }
	| {
			type: "message:new";
			data: { conversationId: number; message: Message };
	  }
	| {
			type: "message:typing";
			data: { conversationId: number; userId: number; expiresAt: string };
	  }
	| {
			type: "messages:unread";
			data: { count: number };
	  }
	| {
			type: "notification:new";
			data: { notification: Notification };
	  }
	| {
			type: "notifications:unread";
			data: { count: number };
	  }
	| {
			type: "room:message:new";
			data: {
				roomType: "trusted_locals" | "live_lounge";
				roomKey: string;
				message: RoomMessage;
			};
	  }
	| {
			type: "ping";
			data: { ts: string };
	  };

type RealtimeListener = (event: RealtimeEvent) => void;

const listeners = new Set<RealtimeListener>();
let activeController: AbortController | null = null;
let reconnectTimer: number | null = null;

function emit(event: RealtimeEvent) {
	for (const listener of listeners) {
		listener(event);
	}
}

function clearReconnectTimer() {
	if (reconnectTimer !== null) {
		window.clearTimeout(reconnectTimer);
		reconnectTimer = null;
	}
}

async function refreshAccessToken(): Promise<string | null> {
	const refreshToken = localStorage.getItem("gp_refresh_token");
	if (!refreshToken) {
		return null;
	}

	try {
		const { data } = await axios.post(`${API_BASE}/api/v1/auth/refresh`, {
			refreshToken
		});
		localStorage.setItem("gp_access_token", data.token as string);
		localStorage.setItem("gp_refresh_token", data.refreshToken as string);
		return data.token as string;
	} catch {
		localStorage.removeItem("gp_access_token");
		localStorage.removeItem("gp_refresh_token");
		window.dispatchEvent(new CustomEvent("auth:expired"));
		return null;
	}
}

function scheduleReconnect() {
	if (reconnectTimer !== null || listeners.size === 0) return;
	clearReconnectTimer();
	reconnectTimer = window.setTimeout(() => {
		reconnectTimer = null;
		void openRealtimeStream();
	}, 1_500);
}

function parseEventBlock(block: string) {
	const lines = block.replace(/\r/g, "").split("\n");
	let eventType = "message";
	let data = "";

	for (const line of lines) {
		if (line.startsWith("event:")) {
			eventType = line.slice(6).trim();
		}
		if (line.startsWith("data:")) {
			data += line.slice(5).trimStart();
		}
	}

	if (!data) return;

	try {
		emit({
			type: eventType as RealtimeEvent["type"],
			data: JSON.parse(data)
		} as RealtimeEvent);
	} catch {
		// ignore malformed events
	}
}

async function consumeStream(response: Response, controller: AbortController) {
	const reader = response.body?.getReader();
	if (!reader) {
		throw new Error("Readable stream unavailable");
	}

	const decoder = new TextDecoder();
	let buffer = "";

	while (!controller.signal.aborted) {
		const { value, done } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });

		let boundary = buffer.indexOf("\n\n");
		while (boundary !== -1) {
			const block = buffer.slice(0, boundary);
			buffer = buffer.slice(boundary + 2);
			parseEventBlock(block);
			boundary = buffer.indexOf("\n\n");
		}
	}
	reader.releaseLock();
}

async function openRealtimeStream(retried = false) {
	if (activeController || listeners.size === 0) return;

	const token = localStorage.getItem("gp_access_token");
	if (!token) return;

	clearReconnectTimer();
	const controller = new AbortController();
	activeController = controller;

	try {
		const response = await fetch(`${API_BASE}/api/v1/realtime/stream`, {
			method: "GET",
			headers: {
				Accept: "text/event-stream",
				Authorization: `Bearer ${token}`
			},
			signal: controller.signal
		});

		if (response.status === 401 && !retried) {
			const refreshedToken = await refreshAccessToken();
			activeController = null;
			if (refreshedToken) {
				void openRealtimeStream(true);
			}
			return;
		}

		if (!response.ok || !response.body) {
			throw new Error(
				`Realtime stream failed with status ${response.status}`
			);
		}

		await consumeStream(response, controller);
	} catch {
		if (!controller.signal.aborted) {
			scheduleReconnect();
		}
	} finally {
		if (activeController === controller) {
			activeController = null;
		}
		if (!controller.signal.aborted) {
			scheduleReconnect();
		}
	}
}

export function subscribeRealtime(listener: RealtimeListener) {
	listeners.add(listener);
	void openRealtimeStream();

	return () => {
		listeners.delete(listener);
		if (listeners.size === 0) {
			clearReconnectTimer();
			activeController?.abort();
			activeController = null;
		}
	};
}

window.addEventListener("auth:expired", () => {
	clearReconnectTimer();
	activeController?.abort();
	activeController = null;
});

import { useState, useEffect, useCallback } from "react";
import { Box, Button, Center, Group, Loader, Stack, Text } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { notificationsApi, type Notification } from "../api/notifications.api";
import { subscribeRealtime } from "../realtime/realtime.client";

function timeAgo(dateStr: string): string {
	const diff = Date.now() - new Date(dateStr).getTime();
	const mins = Math.floor(diff / 60_000);
	if (mins < 1) return "just now";
	if (mins < 60) return `${mins}m ago`;
	const hrs = Math.floor(mins / 60);
	if (hrs < 24) return `${hrs}h ago`;
	return `${Math.floor(hrs / 24)}d ago`;
}

function notifIcon(type: Notification["type"]): string {
	switch (type) {
		case "friend_request":
			return "👤";
		case "friend_accepted":
			return "🤝";
		case "post_vote":
			return "⬆️";
		case "post_comment":
			return "💬";
		case "mention":
			return "📣";
		default:
			return "🔔";
	}
}

const NotificationsPage = () => {
	const { isAuthenticated } = useAuthStore();
	const navigate = useNavigate();

	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [loading, setLoading] = useState(true);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const { data } = await notificationsApi.getNotifications();
			setNotifications(data.data);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (isAuthenticated) {
			void load();
		}
	}, [isAuthenticated, load]);

	useEffect(() => {
		if (!isAuthenticated) return;
		return subscribeRealtime((event) => {
			if (event.type === "notification:new") {
				setNotifications((prev) => {
					if (
						prev.some(
							(notif) => notif.id === event.data.notification.id
						)
					) {
						return prev;
					}
					return [event.data.notification, ...prev];
				});
			}
		});
	}, [isAuthenticated]);

	const handleMarkRead = async (id: number) => {
		await notificationsApi.markRead(id);
		setNotifications((prev) =>
			prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
		);
	};

	const handleMarkAll = async () => {
		await notificationsApi.markAllRead();
		setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
	};

	if (!isAuthenticated) {
		return (
			<Center style={{ height: "100%" }} p={24}>
				<Stack align="center" gap="md">
					<Text size="xl">🔔</Text>
					<Text fw={700} size="lg">
						Sign in to see notifications
					</Text>
					<Button
						onClick={() => navigate("/login")}
						style={{
							background:
								"linear-gradient(135deg, #6c63ff 0%, #8b85ff 100%)",
							height: 48
						}}
					>
						Sign In
					</Button>
				</Stack>
			</Center>
		);
	}

	const unreadCount = notifications.filter((n) => !n.isRead).length;

	return (
		<Box
			style={{
				height: "100%",
				background: "#0a0a0a",
				display: "flex",
				flexDirection: "column"
			}}
		>
			<Box
				style={{
					padding: "20px 16px 12px",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between"
				}}
			>
				<Text fw={700} size="xl" style={{ color: "#fff" }}>
					Notifications
				</Text>
				{unreadCount > 0 && (
					<Button
						size="xs"
						variant="subtle"
						color="violet"
						onClick={handleMarkAll}
					>
						Mark all read
					</Button>
				)}
			</Box>

			<Box style={{ flex: 1, overflowY: "auto" }}>
				{loading ? (
					<Center py={40}>
						<Loader color="violet" />
					</Center>
				) : notifications.length === 0 ? (
					<Center py={60}>
						<Stack align="center" gap="xs">
							<Text size="2xl">🔔</Text>
							<Text fw={600} c="dimmed">
								All caught up!
							</Text>
							<Text size="sm" c="dimmed">
								No notifications yet
							</Text>
						</Stack>
					</Center>
				) : (
					<Stack gap={0}>
						{notifications.map((notif) => (
							<Box
								key={notif.id}
								onClick={() =>
									!notif.isRead && handleMarkRead(notif.id)
								}
								style={{
									padding: "14px 16px",
									borderBottom: "1px solid #1a1a1a",
									background: notif.isRead
										? "transparent"
										: "rgba(108,99,255,0.06)",
									cursor: notif.isRead
										? "default"
										: "pointer",
									transition: "background 0.15s"
								}}
							>
								<Group gap={12} wrap="nowrap">
									<Box
										style={{
											width: 40,
											height: 40,
											borderRadius: "50%",
											background: "#1e1e1e",
											border: "1px solid #2a2a2a",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											fontSize: 18,
											flexShrink: 0
										}}
									>
										{notifIcon(notif.type)}
									</Box>
									<Box style={{ flex: 1, minWidth: 0 }}>
										<Text
											size="sm"
											fw={notif.isRead ? 400 : 600}
											style={{
												color: notif.isRead
													? "#888"
													: "#fff"
											}}
										>
											{notif.message}
										</Text>
										<Text size="xs" c="dimmed" mt={2}>
											{timeAgo(notif.createdAt)}
										</Text>
									</Box>
									{!notif.isRead && (
										<Box
											style={{
												width: 8,
												height: 8,
												borderRadius: "50%",
												background: "#6c63ff",
												flexShrink: 0
											}}
										/>
									)}
								</Group>
							</Box>
						))}
					</Stack>
				)}
			</Box>
		</Box>
	);
};

export default NotificationsPage;

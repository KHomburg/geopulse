import { useState, useEffect, useCallback } from "react";
import {
	Box,
	Button,
	Center,
	Group,
	Loader,
	Paper,
	Stack,
	Text
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { notificationsApi, type Notification } from "../api/notifications.api";
import { subscribeRealtime } from "../realtime/realtime.client";
import {
	ArrowUpIcon,
	BellIcon,
	CommentIcon,
	MessagesIcon,
	ProfileIcon,
	SparkIcon
} from "../components/icons";

function timeAgo(dateStr: string) {
	const diff = Date.now() - new Date(dateStr).getTime();
	const mins = Math.floor(diff / 60_000);
	if (mins < 1) return "just now";
	if (mins < 60) return `${mins}m ago`;
	const hrs = Math.floor(mins / 60);
	if (hrs < 24) return `${hrs}h ago`;
	return `${Math.floor(hrs / 24)}d ago`;
}

function getNotificationIcon(type: Notification["type"]) {
	switch (type) {
		case "friend_request":
			return <ProfileIcon size={18} />;
		case "friend_accepted":
			return <SparkIcon size={16} />;
		case "post_vote":
			return <ArrowUpIcon size={16} />;
		case "post_comment":
			return <CommentIcon size={16} />;
		case "mention":
			return <MessagesIcon size={16} />;
		default:
			return <BellIcon size={16} />;
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
		if (!isAuthenticated) return;
		void load();
	}, [isAuthenticated, load]);

	useEffect(() => {
		if (!isAuthenticated) return;
		return subscribeRealtime((event) => {
			if (event.type === "notification:new") {
				setNotifications((prev) => {
					if (
						prev.some(
							(notification) =>
								notification.id === event.data.notification.id
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
			prev.map((notification) =>
				notification.id === id
					? { ...notification, isRead: true }
					: notification
			)
		);
	};

	const handleMarkAll = async () => {
		await notificationsApi.markAllRead();
		setNotifications((prev) =>
			prev.map((notification) => ({ ...notification, isRead: true }))
		);
	};

	if (!isAuthenticated) {
		return (
			<Box className="gp-page">
				<Center className="gp-scroll">
					<Stack className="gp-empty-state" align="center" gap="md">
						<Box className="gp-brand-mark">
							<BellIcon size={22} />
						</Box>
						<Stack gap={4} align="center">
							<Text fw={700} size="lg">
								Sign in to see notifications
							</Text>
							<Text size="sm" c="dimmed" ta="center">
								Keep mentions, reactions, and moderation signals
								in one refined queue.
							</Text>
						</Stack>
						<Button onClick={() => navigate("/login")}>
							Enter GeoPulse
						</Button>
					</Stack>
				</Center>
			</Box>
		);
	}

	const unreadCount = notifications.filter(
		(notification) => !notification.isRead
	).length;

	return (
		<Box className="gp-page">
			<Box className="gp-page-header">
				<Group justify="space-between" align="flex-start" wrap="nowrap">
					<Box>
						<Text className="gp-page-header__eyebrow">
							Signal center
						</Text>
						<Text className="gp-page-header__title">
							Notifications
						</Text>
						<Text className="gp-page-header__subtitle">
							Follow mentions, contact activity, and pulse
							reactions without the old clutter.
						</Text>
					</Box>
					{unreadCount > 0 && (
						<Button
							variant="subtle"
							color="brand"
							onClick={handleMarkAll}
						>
							Mark all read
						</Button>
					)}
				</Group>
			</Box>

			<Box className="gp-scroll" style={{ paddingTop: 16 }}>
				{loading ? (
					<Center py={56}>
						<Loader color="brand" />
					</Center>
				) : notifications.length === 0 ? (
					<Center py={56}>
						<Stack
							className="gp-empty-state"
							align="center"
							gap="md"
						>
							<Box className="gp-brand-mark">
								<BellIcon size={22} />
							</Box>
							<Stack gap={4} align="center">
								<Text fw={700}>All caught up</Text>
								<Text size="sm" c="dimmed" ta="center">
									No new notifications yet. When the app has
									something worth your attention, it lands
									here.
								</Text>
							</Stack>
						</Stack>
					</Center>
				) : (
					<Stack gap="sm">
						{notifications.map((notification) => (
							<Paper
								component="button"
								type="button"
								key={notification.id}
								className={`gp-surface ${
									notification.isRead
										? ""
										: "gp-surface--strong"
								}`}
								p="lg"
								onClick={() =>
									!notification.isRead &&
									handleMarkRead(notification.id)
								}
								style={{
									textAlign: "left",
									width: "100%",
									cursor: notification.isRead
										? "default"
										: "pointer"
								}}
							>
								<Group
									justify="space-between"
									wrap="nowrap"
									align="flex-start"
								>
									<Group
										gap={12}
										wrap="nowrap"
										align="flex-start"
										style={{ flex: 1, minWidth: 0 }}
									>
										<Box
											style={{
												width: 42,
												height: 42,
												borderRadius: 14,
												background:
													"rgba(255,255,255,0.05)",
												border: "1px solid rgba(255,255,255,0.08)",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												color: "#fffaf2",
												flexShrink: 0
											}}
										>
											{getNotificationIcon(
												notification.type
											)}
										</Box>
										<Box style={{ flex: 1, minWidth: 0 }}>
											<Text
												fw={
													notification.isRead
														? 500
														: 700
												}
												c={
													notification.isRead
														? "dimmed"
														: "inherit"
												}
											>
												{notification.message}
											</Text>
											<Text size="xs" c="dimmed" mt={6}>
												{timeAgo(
													notification.createdAt
												)}
											</Text>
										</Box>
									</Group>
									{!notification.isRead && (
										<Box
											style={{
												width: 9,
												height: 9,
												borderRadius: 999,
												background: "#c4874d",
												flexShrink: 0,
												marginTop: 8
											}}
										/>
									)}
								</Group>
							</Paper>
						))}
					</Stack>
				)}
			</Box>
		</Box>
	);
};

export default NotificationsPage;

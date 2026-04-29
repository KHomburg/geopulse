import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Stack, Text, UnstyledButton } from "@mantine/core";
import { useAuthStore } from "../store/auth.store";
import { messagesApi } from "../api/messages.api";
import { notificationsApi } from "../api/notifications.api";

interface NavItem {
	path: string;
	icon: string;
	label: string;
	requiresAuth?: boolean;
	badgeKey?: "messages" | "notifications";
}

const NAV_ITEMS: NavItem[] = [
	{ path: "/map", icon: "🗺️", label: "Map" },
	{ path: "/feed", icon: "⚡", label: "Feed" },
	{ path: "/post/new", icon: "＋", label: "Post", requiresAuth: true },
	{ path: "/contacts", icon: "👥", label: "People", requiresAuth: true },
	{
		path: "/messages",
		icon: "💬",
		label: "Messages",
		requiresAuth: true,
		badgeKey: "messages"
	},
	{
		path: "/notifications",
		icon: "🔔",
		label: "Alerts",
		requiresAuth: true,
		badgeKey: "notifications"
	},
	{ path: "/bookmarks", icon: "🔖", label: "Saved", requiresAuth: true },
	{ path: "/profile", icon: "👤", label: "Profile" }
];

interface AppLayoutProps {
	children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const { isAuthenticated } = useAuthStore();
	const [unreadMessages, setUnreadMessages] = useState(0);
	const [unreadNotifs, setUnreadNotifs] = useState(0);

	useEffect(() => {
		if (!isAuthenticated) {
			setUnreadMessages(0);
			setUnreadNotifs(0);
			return;
		}
		const fetchCounts = async () => {
			try {
				const [msgRes, notifRes] = await Promise.all([
					messagesApi.getUnreadCount(),
					notificationsApi.getUnreadCount()
				]);
				setUnreadMessages(msgRes.data.count);
				setUnreadNotifs(notifRes.data.count);
			} catch {
				// ignore
			}
		};
		fetchCounts();
		const interval = setInterval(fetchCounts, 15_000);
		return () => clearInterval(interval);
	}, [isAuthenticated]);

	const badgeCounts: Record<string, number> = {
		messages: unreadMessages,
		notifications: unreadNotifs
	};

	const handleNav = (item: NavItem) => {
		if (item.requiresAuth && !isAuthenticated) {
			navigate("/login");
			return;
		}
		navigate(item.path);
	};

	return (
		<Box
			style={{
				display: "flex",
				flexDirection: "column",
				height: "100vh",
				background: "#0a0a0a",
				maxWidth: 480,
				margin: "0 auto",
				position: "relative"
			}}
		>
			{/* Page content */}
			<Box style={{ flex: 1, overflow: "hidden", position: "relative" }}>
				{children}
			</Box>

			{/* Bottom navigation */}
			<Box
				style={{
					display: "flex",
					borderTop: "1px solid #2a2a2a",
					background: "rgba(10,10,10,0.98)",
					backdropFilter: "blur(16px)",
					paddingBottom: "env(safe-area-inset-bottom, 0px)",
					zIndex: 100
				}}
			>
				{NAV_ITEMS.map((item) => {
					const isActive =
						pathname === item.path ||
						pathname.startsWith(item.path + "/");
					const badge = item.badgeKey
						? badgeCounts[item.badgeKey]
						: 0;
					return (
						<UnstyledButton
							key={item.path}
							onClick={() => handleNav(item)}
							style={{
								flex: 1,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								padding: "10px 0 8px",
								transition: "all 0.15s ease"
							}}
						>
							<Stack
								align="center"
								gap={2}
								style={{ position: "relative" }}
							>
								<Box
									style={{
										position: "relative",
										display: "inline-flex"
									}}
								>
									<Text
										style={{
											lineHeight: 1,
											fontSize:
												item.path === "/post/new"
													? 22
													: 18,
											opacity: isActive ? 1 : 0.45,
											filter:
												item.path === "/post/new"
													? "drop-shadow(0 0 8px rgba(108,99,255,0.8))"
													: "none",
											color:
												item.path === "/post/new"
													? "#6c63ff"
													: "#f0f0f0",
											transition: "all 0.15s ease"
										}}
									>
										{item.icon}
									</Text>
									{badge > 0 && (
										<Box
											style={{
												position: "absolute",
												top: -4,
												right: -6,
												minWidth: 14,
												height: 14,
												borderRadius: 7,
												background: "#6c63ff",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												padding: "0 3px"
											}}
										>
											<Text
												style={{
													fontSize: 8,
													color: "#fff",
													fontWeight: 700,
													lineHeight: 1
												}}
											>
												{badge > 99 ? "99+" : badge}
											</Text>
										</Box>
									)}
								</Box>
								<Text
									style={{
										fontSize: 9,
										color: isActive ? "#6c63ff" : "#555",
										fontWeight: isActive ? 700 : 400,
										letterSpacing: 0.5,
										textTransform: "uppercase"
									}}
								>
									{item.label}
								</Text>
							</Stack>
						</UnstyledButton>
					);
				})}
			</Box>
		</Box>
	);
};

export default AppLayout;

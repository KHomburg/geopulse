import { ReactElement, ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Alert, Box, UnstyledButton } from "@mantine/core";
import { useAuthStore } from "../store/auth.store";
import { messagesApi } from "../api/messages.api";
import { notificationsApi } from "../api/notifications.api";
import { subscribeRealtime } from "../realtime/realtime.client";
import { useInboxStore } from "../store/inbox.store";
import { useGeolocation } from "../hooks/useGeolocation";
import { usePresenceTracker } from "../hooks/usePresenceTracker";
import {
	CreateIcon,
	FeedIcon,
	MapIcon,
	MessagesIcon,
	ProfileIcon,
	type IconProps
} from "./icons";

interface NavItem {
	path: string;
	icon: (props: IconProps) => ReactElement;
	label: string;
	requiresAuth?: boolean;
	badgeKey?: "messages" | "notifications";
	emphasis?: boolean;
}

const NAV_ITEMS: NavItem[] = [
	{ path: "/map", icon: MapIcon, label: "Map" },
	{ path: "/feed", icon: FeedIcon, label: "Feed" },
	{
		path: "/post/new",
		icon: CreateIcon,
		label: "Post",
		requiresAuth: true,
		emphasis: true
	},
	{
		path: "/messages",
		icon: MessagesIcon,
		label: "Messages",
		requiresAuth: true,
		badgeKey: "messages"
	},
	{ path: "/profile", icon: ProfileIcon, label: "Profile" }
];

interface AppLayoutProps {
	children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
	useGeolocation();
	usePresenceTracker();

	const navigate = useNavigate();
	const { pathname } = useLocation();
	const { isAuthenticated, accountNotice } = useAuthStore();
	const unreadMessages = useInboxStore((state) => state.unreadMessages);
	const unreadNotifs = useInboxStore((state) => state.unreadNotifications);
	const setUnreadMessages = useInboxStore((state) => state.setUnreadMessages);
	const setUnreadNotifications = useInboxStore(
		(state) => state.setUnreadNotifications
	);
	const resetInbox = useInboxStore((state) => state.resetInbox);

	useEffect(() => {
		if (!isAuthenticated) {
			resetInbox();
			return;
		}
		const fetchCounts = async () => {
			try {
				const [msgRes, notifRes] = await Promise.all([
					messagesApi.getUnreadCount(),
					notificationsApi.getUnreadCount()
				]);
				setUnreadMessages(msgRes.data.count);
				setUnreadNotifications(notifRes.data.count);
			} catch {
				// ignore
			}
		};
		void fetchCounts();
		const unsubscribe = subscribeRealtime((event) => {
			if (event.type === "realtime:init") {
				setUnreadMessages(event.data.messagesUnread);
				setUnreadNotifications(event.data.notificationsUnread);
				return;
			}
			if (event.type === "messages:unread") {
				setUnreadMessages(event.data.count);
				return;
			}
			if (event.type === "notifications:unread") {
				setUnreadNotifications(event.data.count);
			}
		});
		return unsubscribe;
	}, [
		isAuthenticated,
		resetInbox,
		setUnreadMessages,
		setUnreadNotifications
	]);

	useEffect(() => {
		if (accountNotice?.kind === "banned") {
			navigate("/login", { replace: true });
		}
	}, [accountNotice, navigate]);

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

	const isNavItemActive = (item: NavItem) => {
		if (item.path === "/profile") {
			return (
				pathname === "/profile" ||
				pathname.startsWith("/profile/") ||
				pathname === "/contacts" ||
				pathname === "/bookmarks"
			);
		}
		return pathname === item.path || pathname.startsWith(item.path + "/");
	};

	return (
		<Box className="gp-app-shell">
			<Box className="gp-app-shell__frame">
				{accountNotice?.kind === "read_only" && (
					<Box className="gp-notice-banner">
						<Alert color="yellow" variant="light" radius="md">
							{accountNotice.message}
						</Alert>
					</Box>
				)}

				<Box className="gp-app-shell__content">{children}</Box>

				<Box className="gp-bottom-dock">
					{NAV_ITEMS.map((item) => {
						const isActive = isNavItemActive(item);
						const badge = item.badgeKey
							? badgeCounts[item.badgeKey]
							: 0;
						const Icon = item.icon;
						const buttonClassName = [
							"gp-bottom-dock__button",
							isActive ? "gp-bottom-dock__button--active" : ""
						]
							.filter(Boolean)
							.join(" ");

						return (
							<UnstyledButton
								key={item.path}
								onClick={() => handleNav(item)}
								aria-label={item.label}
								title={item.label}
								className={buttonClassName}
							>
								<Box className="gp-bottom-dock__icon-shell">
									<Icon className="gp-nav-icon" />
									{badge > 0 && (
										<Box className="gp-bottom-dock__badge">
											{badge > 99 ? "99+" : badge}
										</Box>
									)}
								</Box>
							</UnstyledButton>
						);
					})}
				</Box>
			</Box>
		</Box>
	);
};

export default AppLayout;

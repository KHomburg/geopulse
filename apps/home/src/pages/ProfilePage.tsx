import { useEffect, useState, type ReactNode } from "react";
import {
	Avatar,
	Badge,
	Box,
	Button,
	Center,
	Group,
	Paper,
	Stack,
	Text
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { userApi, type CurrentUser } from "../api/user.api";
import {
	AnonymousIcon,
	BookmarkIcon,
	ChevronRightIcon,
	GlobeIcon,
	ProfileIcon,
	ShieldIcon,
	SparkIcon,
	TicketIcon
} from "../components/icons";

type ProfileMenuItem = {
	title: string;
	description: string;
	icon: ReactNode;
	onClick: () => void;
};

const ProfilePage = () => {
	const { email, userId, isAuthenticated, logout } = useAuthStore();
	const navigate = useNavigate();
	const [profile, setProfile] = useState<CurrentUser | null>(null);

	useEffect(() => {
		if (!isAuthenticated) return;
		userApi
			.getMe()
			.then(({ data }) => setProfile(data))
			.catch(() => setProfile(null));
	}, [isAuthenticated]);

	if (!isAuthenticated) {
		return (
			<Box className="gp-page">
				<Center className="gp-scroll">
					<Stack className="gp-empty-state" align="center" gap="md">
						<Box className="gp-brand-mark">
							<ProfileIcon size={22} />
						</Box>
						<Stack
							gap={4}
							align="center"
							className="gp-empty-state__copy"
						>
							<Text fw={700} size="lg">
								Sign in to GeoPulse
							</Text>
							<Text size="sm" c="dimmed" ta="center">
								Sign in to shape your local identity, track
								momentum, and keep your saved spaces in one
								place.
							</Text>
						</Stack>
						<Box className="gp-empty-state__actions">
							<Button onClick={() => navigate("/login")}>
								Sign in to manage your space
							</Button>
							<Button
								variant="light"
								color="brand"
								onClick={() => navigate("/register")}
							>
								Create account
							</Button>
						</Box>
					</Stack>
				</Center>
			</Box>
		);
	}

	const handleLogout = async () => {
		await logout();
		navigate("/map");
	};

	const momentumItems: ProfileMenuItem[] = [
		{
			title: "Karma Shop",
			description: "Spend karma on map pin perks and super-post boosts.",
			icon: <TicketIcon size={18} />,
			onClick: () => navigate("/profile/karmashop")
		},
		{
			title: "Trusted Locals",
			description: "Enter the 500+ karma feed and private room.",
			icon: <ShieldIcon size={18} />,
			onClick: () => navigate("/profile/trusted-locals")
		},
		{
			title: "Ghost Mode",
			description:
				"Share a fuzzy live pin with accepted friends for a set time.",
			icon: <AnonymousIcon size={18} />,
			onClick: () => navigate("/profile/ghost-mode")
		}
	];

	const spaceItems: ProfileMenuItem[] = [
		{
			title: "People",
			description: "Manage contacts and friend requests.",
			icon: <ProfileIcon size={18} />,
			onClick: () => navigate("/contacts")
		},
		{
			title: "Saved",
			description: "Revisit posts you kept for later.",
			icon: <BookmarkIcon size={18} />,
			onClick: () => navigate("/bookmarks")
		}
	];

	const accountItems: ProfileMenuItem[] = [
		{
			title: "Privacy Policy",
			description:
				"Review how the app handles location and identity data.",
			icon: <ShieldIcon size={18} />,
			onClick: () => undefined
		},
		{
			title: "About GeoPulse",
			description: "Read the product story and platform direction.",
			icon: <GlobeIcon size={18} />,
			onClick: () => undefined
		}
	];

	const renderMenuItem = (item: ProfileMenuItem) => (
		<Paper
			component="button"
			type="button"
			key={item.title}
			className="gp-surface"
			p="lg"
			onClick={item.onClick}
			style={{ textAlign: "left", width: "100%", cursor: "pointer" }}
		>
			<Group justify="space-between" align="flex-start" wrap="nowrap">
				<Group
					gap={12}
					align="flex-start"
					wrap="nowrap"
					style={{ flex: 1, minWidth: 0 }}
				>
					<Box
						style={{
							width: 42,
							height: 42,
							borderRadius: 14,
							background: "rgba(255,255,255,0.05)",
							border: "1px solid rgba(255,255,255,0.08)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							color: "#fffaf2",
							flexShrink: 0
						}}
					>
						{item.icon}
					</Box>
					<Box style={{ minWidth: 0 }}>
						<Text fw={700}>{item.title}</Text>
						<Text size="sm" c="dimmed" mt={4}>
							{item.description}
						</Text>
					</Box>
				</Group>
				<ChevronRightIcon
					size={18}
					style={{ color: "rgba(255,250,242,0.55)", flexShrink: 0 }}
				/>
			</Group>
		</Paper>
	);

	return (
		<Box className="gp-page">
			<Box className="gp-page-header">
				<Text className="gp-page-header__eyebrow">Your space</Text>
				<Text className="gp-page-header__title">Profile</Text>
				<Text className="gp-page-header__subtitle">
					Your account, saved momentum, and private perks brought into
					the same polished visual system.
				</Text>
			</Box>

			<Box className="gp-scroll" style={{ paddingTop: 16 }}>
				<Stack gap="lg">
					<Paper className="gp-surface gp-surface--strong" p="xl">
						<Group gap={16} align="center" wrap="nowrap">
							<Avatar
								radius={28}
								size={72}
								style={{
									background:
										"linear-gradient(135deg, #c4874d, #65b8b0)",
									color: "#161616",
									flexShrink: 0
								}}
							>
								{email?.[0]?.toUpperCase() ?? "?"}
							</Avatar>
							<Box>
								<Text
									fw={700}
									size="lg"
									style={{ wordBreak: "break-word" }}
								>
									{email}
								</Text>
								<Text size="sm" c="dimmed" mt={2}>
									User #{userId}
								</Text>
								<Group gap={8} mt={10}>
									<Badge color="brand" variant="light">
										{profile?.karmaScore ?? 0} karma bank
									</Badge>
									<Badge
										color={
											profile?.isTrusted ? "teal" : "gray"
										}
										variant="light"
									>
										{profile?.isTrusted
											? "Trusted access unlocked"
											: "Trust building"}
									</Badge>
								</Group>
							</Box>
						</Group>
						<Box className="gp-mini-pill" w="fit-content" mt={16}>
							<SparkIcon size={14} />
							<Text size="xs" c="inherit">
								Momentum is tied to karma, trust, and the spaces
								you unlock.
							</Text>
						</Box>
					</Paper>

					<Stack gap="sm">
						<Text className="gp-page-header__eyebrow">
							Momentum
						</Text>
						{momentumItems.map(renderMenuItem)}
					</Stack>

					<Stack gap="sm">
						<Text className="gp-page-header__eyebrow">
							Your space
						</Text>
						{spaceItems.map(renderMenuItem)}
					</Stack>

					<Stack gap="sm">
						<Text className="gp-page-header__eyebrow">Account</Text>
						{accountItems.map(renderMenuItem)}
					</Stack>

					<Button
						variant="outline"
						color="red"
						onClick={handleLogout}
						fullWidth
					>
						Sign out
					</Button>
				</Stack>
			</Box>
		</Box>
	);
};

export default ProfilePage;

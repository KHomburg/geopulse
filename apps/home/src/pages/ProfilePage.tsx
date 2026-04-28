import {
	Box,
	Button,
	Center,
	Stack,
	Text,
	Avatar,
	Divider,
	Group
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

const ProfilePage = () => {
	const { email, userId, isAuthenticated, logout } = useAuthStore();
	const navigate = useNavigate();

	if (!isAuthenticated) {
		return (
			<Center style={{ height: "100%", flexDirection: "column" }} p={24}>
				<Stack align="center" gap="md">
					<Text size="xl">👤</Text>
					<Text fw={700} size="lg">
						Sign in to GeoPulse
					</Text>
					<Text c="dimmed" size="sm" ta="center">
						Create an account to post pulses and interact with your
						community.
					</Text>
					<Button
						fullWidth
						onClick={() => navigate("/login")}
						style={{
							background:
								"linear-gradient(135deg, #6c63ff 0%, #8b85ff 100%)",
							height: 48
						}}
					>
						Sign In
					</Button>
					<Button
						fullWidth
						variant="outline"
						color="violet"
						onClick={() => navigate("/register")}
						style={{ height: 44 }}
					>
						Create Account
					</Button>
				</Stack>
			</Center>
		);
	}

	const handleLogout = async () => {
		await logout();
		navigate("/map");
	};

	return (
		<Box
			style={{
				height: "100%",
				background: "#0a0a0a",
				overflowY: "auto",
				padding: "24px 16px"
			}}
		>
			<Stack align="center" mb={32} gap={12}>
				<Avatar
					radius="xl"
					size={72}
					color="violet"
					style={{
						background: "#2a2a2a",
						border: "2px solid #6c63ff"
					}}
				>
					{email?.[0]?.toUpperCase() ?? "?"}
				</Avatar>
				<Stack align="center" gap={4}>
					<Text fw={700} size="lg">
						{email}
					</Text>
					<Text c="dimmed" size="sm">
						User #{userId}
					</Text>
				</Stack>
			</Stack>

			<Divider color="#2a2a2a" mb={24} />

			<Stack gap="xs">
				<Text
					size="xs"
					c="dimmed"
					fw={600}
					style={{ textTransform: "uppercase", letterSpacing: 0.5 }}
					mb={8}
				>
					Account
				</Text>

				<Box
					style={{
						background: "#141414",
						border: "1px solid #2a2a2a",
						borderRadius: 12,
						padding: "12px 16px"
					}}
				>
					<Group justify="space-between">
						<Text size="sm">Privacy Policy</Text>
						<Text c="dimmed" size="sm">
							›
						</Text>
					</Group>
				</Box>

				<Box
					style={{
						background: "#141414",
						border: "1px solid #2a2a2a",
						borderRadius: 12,
						padding: "12px 16px"
					}}
				>
					<Group justify="space-between">
						<Text size="sm">About GeoPulse</Text>
						<Text c="dimmed" size="sm">
							›
						</Text>
					</Group>
				</Box>

				<Button
					variant="outline"
					color="red"
					mt={16}
					onClick={handleLogout}
					fullWidth
					style={{
						borderColor: "#ff475740",
						color: "#ff4757",
						height: 44
					}}
				>
					Sign Out
				</Button>
			</Stack>
		</Box>
	);
};

export default ProfilePage;

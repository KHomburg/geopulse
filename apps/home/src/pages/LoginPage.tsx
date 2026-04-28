import { useState } from "react";
import {
	Box,
	Button,
	Center,
	Stack,
	Text,
	TextInput,
	PasswordInput,
	Alert,
	Anchor
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

const LoginPage = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const { login, isLoading, error, clearError } = useAuthStore();
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await login(email, password);
		const { isAuthenticated } = useAuthStore.getState();
		if (isAuthenticated) navigate("/map");
	};

	return (
		<Center
			style={{
				height: "100vh",
				background: "linear-gradient(180deg, #0a0a0a 0%, #13111c 100%)"
			}}
		>
			<Box style={{ width: "100%", maxWidth: 380, padding: "0 24px" }}>
				<Stack align="center" mb={40} gap={4}>
					<Text
						style={{
							fontSize: 32,
							fontWeight: 800,
							letterSpacing: -1,
							color: "#6c63ff"
						}}
					>
						GeoPulse
					</Text>
					<Text c="dimmed" size="sm">
						Discover what's happening around you
					</Text>
				</Stack>

				<form onSubmit={handleSubmit}>
					<Stack gap="md">
						{error && (
							<Alert
								color="red"
								onClose={clearError}
								withCloseButton
							>
								{error}
							</Alert>
						)}

						<TextInput
							label="Email"
							placeholder="you@example.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							type="email"
							autoComplete="email"
						/>

						<PasswordInput
							label="Password"
							placeholder="••••••••"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							autoComplete="current-password"
						/>

						<Button
							type="submit"
							fullWidth
							loading={isLoading}
							mt="sm"
							style={{
								background:
									"linear-gradient(135deg, #6c63ff 0%, #8b85ff 100%)",
								height: 48
							}}
						>
							Sign In
						</Button>

						<Text ta="center" size="sm" c="dimmed">
							No account yet?{" "}
							<Anchor
								component="button"
								type="button"
								onClick={() => navigate("/register")}
								style={{ color: "#6c63ff" }}
							>
								Sign Up
							</Anchor>
						</Text>
					</Stack>
				</form>
			</Box>
		</Center>
	);
};

export default LoginPage;

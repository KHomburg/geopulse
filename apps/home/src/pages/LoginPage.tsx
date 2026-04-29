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
import { BrandPulseIcon } from "../components/icons";

const LoginPage = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const {
		login,
		isLoading,
		error,
		accountNotice,
		clearError,
		clearAccountNotice
	} = useAuthStore();
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await login(email, password);
		const { isAuthenticated } = useAuthStore.getState();
		if (isAuthenticated) navigate("/map");
	};

	return (
		<Center className="gp-auth-shell">
			<Box className="gp-auth-card">
				<Stack gap="xl">
					<Stack gap="md">
						<Box className="gp-mini-pill" w="fit-content">
							Real-world signals, beautifully organized
						</Box>
						<Box className="gp-brand-lockup">
							<Box className="gp-brand-mark">
								<BrandPulseIcon size={28} />
							</Box>
							<Box>
								<Text className="gp-brand-title">GeoPulse</Text>
								<Text className="gp-brand-subtitle">
									A polished local network for what is
									happening right now.
								</Text>
							</Box>
						</Box>
					</Stack>

					<form onSubmit={handleSubmit}>
						<Stack gap="md">
							{accountNotice && (
								<Alert
									color={
										accountNotice.kind === "banned"
											? "red"
											: "yellow"
									}
									onClose={clearAccountNotice}
									withCloseButton
								>
									{accountNotice.message}
								</Alert>
							)}

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
								description="Use the account tied to your local identity."
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
								h={50}
							>
								Enter GeoPulse
							</Button>

							<Text ta="center" size="sm" c="dimmed">
								No account yet?{" "}
								<Anchor
									component="button"
									type="button"
									onClick={() => navigate("/register")}
									style={{ color: "#6c63ff" }}
								>
									Create one
								</Anchor>
							</Text>
						</Stack>
					</form>
				</Stack>
			</Box>
		</Center>
	);
};

export default LoginPage;

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
	Anchor,
	Progress
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

function passwordStrength(pwd: string): {
	score: number;
	label: string;
	color: string;
} {
	let score = 0;
	if (pwd.length >= 8) score++;
	if (/[A-Z]/.test(pwd)) score++;
	if (/[0-9]/.test(pwd)) score++;
	if (/[^A-Za-z0-9]/.test(pwd)) score++;
	const labels = ["Weak", "Fair", "Good", "Strong"];
	const colors = ["red", "orange", "yellow", "green"];
	return {
		score,
		label: labels[score - 1] ?? "Weak",
		color: colors[score - 1] ?? "red"
	};
}

const RegisterPage = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const {
		register,
		isLoading,
		error,
		accountNotice,
		clearError,
		clearAccountNotice
	} = useAuthStore();
	const navigate = useNavigate();

	const strength = passwordStrength(password);
	const mismatch = confirm.length > 0 && password !== confirm;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (password !== confirm) return;
		await register(email, password);
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
						Join the local pulse
					</Text>
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
							placeholder="you@example.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							type="email"
							autoComplete="email"
						/>

						<Box>
							<PasswordInput
								label="Password"
								placeholder="Min. 6 characters"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								minLength={6}
								autoComplete="new-password"
							/>
							{password.length > 0 && (
								<Box mt={6}>
									<Progress
										value={(strength.score / 4) * 100}
										color={strength.color}
										size="xs"
										radius="xl"
									/>
									<Text size="xs" c="dimmed" mt={4}>
										{strength.label}
									</Text>
								</Box>
							)}
						</Box>

						<PasswordInput
							label="Confirm Password"
							placeholder="Re-enter password"
							value={confirm}
							onChange={(e) => setConfirm(e.target.value)}
							required
							error={
								mismatch ? "Passwords do not match" : undefined
							}
							autoComplete="new-password"
						/>

						<Button
							type="submit"
							fullWidth
							loading={isLoading}
							disabled={mismatch}
							mt="sm"
							style={{
								background:
									"linear-gradient(135deg, #6c63ff 0%, #8b85ff 100%)",
								height: 48
							}}
						>
							Create Account
						</Button>

						<Text ta="center" size="sm" c="dimmed">
							Already have an account?{" "}
							<Anchor
								component="button"
								type="button"
								onClick={() => navigate("/login")}
								style={{ color: "#6c63ff" }}
							>
								Sign In
							</Anchor>
						</Text>
					</Stack>
				</form>
			</Box>
		</Center>
	);
};

export default RegisterPage;

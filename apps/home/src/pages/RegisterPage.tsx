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
import { BrandPulseIcon } from "../components/icons";

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
		<Center className="gp-auth-shell">
			<Box className="gp-auth-card">
				<Stack gap="xl">
					<Stack gap="md">
						<Box className="gp-mini-pill" w="fit-content">
							Elegant local discovery starts here
						</Box>
						<Box className="gp-brand-lockup">
							<Box className="gp-brand-mark">
								<BrandPulseIcon size={28} />
							</Box>
							<Box>
								<Text className="gp-brand-title">GeoPulse</Text>
								<Text className="gp-brand-subtitle">
									Build a more trusted view of your
									neighborhood.
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
								description="A valid email keeps your location identity recoverable."
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
									onChange={(e) =>
										setPassword(e.target.value)
									}
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
									mismatch
										? "Passwords do not match"
										: undefined
								}
								autoComplete="new-password"
							/>

							<Button
								type="submit"
								fullWidth
								loading={isLoading}
								disabled={mismatch}
								mt="sm"
								h={50}
							>
								Create account
							</Button>

							<Text ta="center" size="sm" c="dimmed">
								Already have an account?{" "}
								<Anchor
									component="button"
									type="button"
									onClick={() => navigate("/login")}
									className="gp-auth-link"
								>
									Sign In
								</Anchor>
							</Text>
						</Stack>
					</form>
				</Stack>
			</Box>
		</Center>
	);
};

export default RegisterPage;

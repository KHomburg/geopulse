import { useState } from "react";
import { Box, Button, Group, Paper, Stack, Text } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { ghostApi } from "../api/ghost.api";
import { useFeedStore } from "../store/feed.store";
import { useAuthStore } from "../store/auth.store";
import { useGeolocation } from "../hooks/useGeolocation";
import { getApiErrorMessage } from "../utils/apiErrors";

const DURATIONS = [30, 60, 120];

const GhostModePage = () => {
	const navigate = useNavigate();
	const location = useFeedStore((state) => state.location);
	const accountNotice = useAuthStore((state) => state.accountNotice);
	const isWriteBlocked = accountNotice?.kind === "read_only";
	const [status, setStatus] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState<number | null>(null);
	useGeolocation();

	const handleShare = async (durationMinutes: number) => {
		if (location.lat == null || location.lng == null || isWriteBlocked)
			return;
		setLoading(durationMinutes);
		try {
			await ghostApi.shareLocation({
				lat: location.lat,
				lng: location.lng,
				durationMinutes
			});
			setStatus(`Sharing with friends for ${durationMinutes} minutes`);
			setError(null);
		} catch (err: unknown) {
			setError(getApiErrorMessage(err, "Failed to enable Ghost Mode"));
		} finally {
			setLoading(null);
		}
	};

	const handleStop = async () => {
		setLoading(-1);
		try {
			await ghostApi.stopSharing();
			setStatus("Ghost mode is off");
			setError(null);
		} catch (err: unknown) {
			setError(getApiErrorMessage(err, "Failed to disable Ghost Mode"));
		} finally {
			setLoading(null);
		}
	};

	return (
		<Box
			style={{
				height: "100%",
				background: "#0a0a0a",
				padding: "20px 16px",
				overflowY: "auto"
			}}
		>
			<Group justify="space-between" mb={20}>
				<Button
					variant="subtle"
					color="gray"
					onClick={() => navigate(-1)}
				>
					← Back
				</Button>
				<Text fw={700}>Ghost Mode</Text>
				<Box w={60} />
			</Group>

			<Stack gap="md">
				{accountNotice?.kind === "read_only" && (
					<Text size="sm" c="yellow">
						{accountNotice.message}
					</Text>
				)}
				{error && (
					<Text size="sm" c="red">
						{error}
					</Text>
				)}

				<Paper
					radius="lg"
					style={{
						background: "#141414",
						border: "1px solid #2a2a2a",
						padding: 18
					}}
				>
					<Text fw={700} mb={6}>
						Share a fuzzy block-level position with accepted friends
					</Text>
					<Text size="sm" c="dimmed">
						GeoPulse obfuscates the pin to a rough block radius and
						stops sharing automatically after the timer ends.
					</Text>
				</Paper>

				<Stack gap="xs">
					{DURATIONS.map((duration) => (
						<Button
							key={duration}
							fullWidth
							variant="outline"
							color="violet"
							loading={loading === duration}
							onClick={() => handleShare(duration)}
							disabled={location.lat == null || isWriteBlocked}
						>
							{isWriteBlocked
								? "Read-only"
								: `Share for ${duration} minutes`}
						</Button>
					))}
					<Button
						fullWidth
						color="red"
						variant="subtle"
						loading={loading === -1}
						onClick={handleStop}
					>
						Stop sharing
					</Button>
				</Stack>

				{status && (
					<Text size="sm" c="dimmed">
						{status}
					</Text>
				)}
			</Stack>
		</Box>
	);
};

export default GhostModePage;

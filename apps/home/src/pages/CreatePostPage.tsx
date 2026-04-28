import { useState } from "react";
import {
	Box,
	Button,
	Group,
	SegmentedControl,
	Stack,
	Text,
	Textarea,
	TextInput
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { postsApi, type AnonymityMode } from "../api/posts.api";
import { useFeedStore } from "../store/feed.store";
import { useGeolocation } from "../hooks/useGeolocation";

const ANONYMITY_DATA = [
	{ label: "🌍 Public", value: "public" },
	{ label: "🎭 Alias", value: "local_legend" },
	{ label: "👤 Anon", value: "anonymous" }
];

const CreatePostPage = () => {
	const navigate = useNavigate();
	const { location, addPost } = useFeedStore();
	useGeolocation();

	const [content, setContent] = useState("");
	const [mode, setMode] = useState<AnonymityMode>("public");
	const [pseudonym, setPseudonym] = useState("");
	const [isStory, setIsStory] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");

	const canSubmit =
		content.trim().length > 0 &&
		(mode !== "local_legend" || pseudonym.trim().length > 0) &&
		location.lat !== null;

	const handleSubmit = async () => {
		if (!canSubmit || !location.lat || !location.lng) return;
		setIsSubmitting(true);
		setError("");
		try {
			const { data } = await postsApi.createPost({
				content: content.trim(),
				anonymityMode: mode,
				pseudonym:
					mode === "local_legend" ? pseudonym.trim() : undefined,
				lat: location.lat,
				lng: location.lng,
				isStory
			});
			addPost(data);
			navigate("/feed");
		} catch (err: unknown) {
			const msg =
				(err as { response?: { data?: { message?: string } } })
					?.response?.data?.message ?? "Failed to post";
			setError(msg);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Box
			style={{
				height: "100%",
				display: "flex",
				flexDirection: "column",
				background: "#0a0a0a",
				padding: "20px 16px"
			}}
		>
			{/* Header */}
			<Group justify="space-between" mb={24} align="center">
				<Button
					variant="subtle"
					color="gray"
					size="compact-sm"
					onClick={() => navigate(-1)}
					style={{ color: "#888" }}
				>
					✕ Cancel
				</Button>
				<Text fw={700} size="md">
					New Pulse
				</Text>
				<Button
					size="compact-sm"
					disabled={!canSubmit}
					loading={isSubmitting}
					onClick={handleSubmit}
					style={{
						background: canSubmit
							? "linear-gradient(135deg, #6c63ff 0%, #8b85ff 100%)"
							: "#2a2a2a"
					}}
				>
					Post
				</Button>
			</Group>

			<Stack gap="lg" style={{ flex: 1 }}>
				{/* Anonymity mode */}
				<Box>
					<Text
						size="xs"
						c="dimmed"
						mb={8}
						fw={600}
						style={{
							textTransform: "uppercase",
							letterSpacing: 0.5
						}}
					>
						Post as
					</Text>
					<SegmentedControl
						fullWidth
						data={ANONYMITY_DATA}
						value={mode}
						onChange={(val) => setMode(val as AnonymityMode)}
					/>
				</Box>

				{/* Pseudonym input for local_legend */}
				{mode === "local_legend" && (
					<TextInput
						label="Your alias"
						placeholder="e.g. NightOwl, StreetPulse…"
						value={pseudonym}
						onChange={(e) => setPseudonym(e.target.value)}
						maxLength={50}
					/>
				)}

				{/* Content */}
				<Textarea
					label="What's happening here?"
					placeholder="Share what you see, hear, or feel around you…"
					value={content}
					onChange={(e) => setContent(e.target.value)}
					minRows={5}
					maxRows={10}
					maxLength={2000}
					autosize
				/>

				{/* Story toggle */}
				<Group gap={12} align="center">
					<Box
						onClick={() => setIsStory((s) => !s)}
						style={{
							width: 44,
							height: 24,
							borderRadius: 12,
							background: isStory ? "#6c63ff" : "#2a2a2a",
							position: "relative",
							cursor: "pointer",
							transition: "background 0.2s ease",
							flexShrink: 0
						}}
					>
						<Box
							style={{
								position: "absolute",
								top: 2,
								left: isStory ? 22 : 2,
								width: 20,
								height: 20,
								borderRadius: "50%",
								background: "#fff",
								transition: "left 0.2s ease"
							}}
						/>
					</Box>
					<Stack gap={0}>
						<Text size="sm" fw={600}>
							24h Story
						</Text>
						<Text size="xs" c="dimmed">
							Disappears after 24 hours
						</Text>
					</Stack>
				</Group>

				{/* Location status */}
				<Text size="xs" c={location.lat ? "green" : "dimmed"}>
					{location.lat
						? `📍 Located at ${location.lat.toFixed(
								4
						  )}, ${location.lng?.toFixed(4)}`
						: "📍 Acquiring location…"}
				</Text>

				{error && (
					<Text c="red" size="sm">
						{error}
					</Text>
				)}
			</Stack>
		</Box>
	);
};

export default CreatePostPage;

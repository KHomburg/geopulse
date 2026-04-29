import { useEffect, useState } from "react";
import {
	Badge,
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
import { POST_TAGS, type PostTagKey } from "../constants/postTags";
import { userApi, type CurrentUser } from "../api/user.api";

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
	const [postType, setPostType] = useState<"standard" | "drop">("standard");
	const [selectedTags, setSelectedTags] = useState<PostTagKey[]>([]);
	const [dropHint, setDropHint] = useState("");
	const [dropUnlockRadiusMeters] = useState(20);
	const [isSuperLocalLegend, setIsSuperLocalLegend] = useState(false);
	const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
	const [isStory, setIsStory] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		userApi
			.getMe()
			.then(({ data }) => setCurrentUser(data))
			.catch(() => setCurrentUser(null));
	}, []);

	const canSubmit =
		content.trim().length > 0 &&
		(mode !== "local_legend" || pseudonym.trim().length > 0) &&
		(postType !== "drop" || dropHint.trim().length > 0) &&
		location.lat !== null;

	const toggleTag = (tag: PostTagKey) => {
		setSelectedTags((current) => {
			if (current.includes(tag)) {
				return current.filter((item) => item !== tag);
			}
			if (current.length >= 3) {
				return current;
			}
			return [...current, tag];
		});
	};

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
				postType,
				tags: selectedTags,
				dropHint: postType === "drop" ? dropHint.trim() : undefined,
				dropUnlockRadiusMeters,
				isSuperLocalLegend,
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
						Post type
					</Text>
					<SegmentedControl
						fullWidth
						data={[
							{ label: "Pulse", value: "standard" },
							{ label: "Drop", value: "drop" }
						]}
						value={postType}
						onChange={(value) =>
							setPostType(value as "standard" | "drop")
						}
					/>
				</Box>

				{postType === "drop" && (
					<TextInput
						label="Drop hint"
						placeholder="Tease what unlocks when someone gets close"
						value={dropHint}
						onChange={(event) =>
							setDropHint(event.currentTarget.value)
						}
						maxLength={140}
						description={`Unlock radius fixed at ${dropUnlockRadiusMeters}m`}
					/>
				)}

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
						Vibe tags
					</Text>
					<Group gap={8}>
						{POST_TAGS.map((tag) => {
							const selected = selectedTags.includes(tag.key);
							return (
								<Button
									key={tag.key}
									size="xs"
									variant={selected ? "filled" : "outline"}
									color={selected ? "violet" : "gray"}
									onClick={() => toggleTag(tag.key)}
								>
									{tag.icon} {tag.label}
								</Button>
							);
						})}
					</Group>
				</Box>

				{mode === "local_legend" &&
					(currentUser?.superPostCredits ?? 0) > 0 && (
						<Group gap={12} align="center">
							<Box
								onClick={() =>
									setIsSuperLocalLegend((value) => !value)
								}
								style={{
									width: 44,
									height: 24,
									borderRadius: 12,
									background: isSuperLocalLegend
										? "#ff9f43"
										: "#2a2a2a",
									position: "relative",
									cursor: "pointer"
								}}
							>
								<Box
									style={{
										position: "absolute",
										top: 2,
										left: isSuperLocalLegend ? 22 : 2,
										width: 20,
										height: 20,
										borderRadius: "50%",
										background: "#fff"
									}}
								/>
							</Box>
							<Stack gap={0}>
								<Text size="sm" fw={600}>
									Super Local Legend
								</Text>
								<Text size="xs" c="dimmed">
									Pins this post to the top for an extra hour.{" "}
									{currentUser?.superPostCredits} credit(s)
									left.
								</Text>
							</Stack>
						</Group>
					)}

				{mode === "local_legend" &&
					(currentUser?.superPostCredits ?? 0) === 0 && (
						<Badge color="yellow" variant="light">
							Visit the Karma Shop to unlock Super Local Legend
							boosts
						</Badge>
					)}

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

import { useEffect, useState } from "react";
import {
	ActionIcon,
	Alert,
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
import { useAuthStore } from "../store/auth.store";
import { useGeolocation } from "../hooks/useGeolocation";
import { POST_TAGS, type PostTagKey } from "../constants/postTags";
import { userApi, type CurrentUser } from "../api/user.api";
import PostMediaGallery from "../components/PostMediaGallery";

const ANONYMITY_DATA = [
	{ label: "🌍 Public", value: "public" },
	{ label: "🎭 Alias", value: "local_legend" },
	{ label: "👤 Anon", value: "anonymous" }
];

const MAX_POST_MEDIA_ITEMS = 6;

const CreatePostPage = () => {
	const navigate = useNavigate();
	const { location, addPost } = useFeedStore();
	const accountNotice = useAuthStore((state) => state.accountNotice);
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
	const [mediaInputs, setMediaInputs] = useState([""]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		userApi
			.getMe()
			.then(({ data }) => setCurrentUser(data))
			.catch(() => setCurrentUser(null));
	}, []);

	const isWriteBlocked = accountNotice?.kind === "read_only";
	const mediaUrls = mediaInputs
		.map((value) => value.trim())
		.filter(Boolean)
		.slice(0, MAX_POST_MEDIA_ITEMS);
	const canSubmit =
		(content.trim().length > 0 || mediaUrls.length > 0) &&
		(mode !== "local_legend" || pseudonym.trim().length > 0) &&
		(postType !== "drop" || dropHint.trim().length > 0) &&
		location.lat !== null &&
		!isWriteBlocked;

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

	const updateMediaInput = (index: number, value: string) => {
		setMediaInputs((current) =>
			current.map((entry, entryIndex) =>
				entryIndex === index ? value : entry
			)
		);
	};

	const addMediaInput = () => {
		setMediaInputs((current) =>
			current.length >= MAX_POST_MEDIA_ITEMS ? current : [...current, ""]
		);
	};

	const removeMediaInput = (index: number) => {
		setMediaInputs((current) => {
			const next = current.filter(
				(_, entryIndex) => entryIndex !== index
			);
			return next.length > 0 ? next : [""];
		});
	};

	const handleSubmit = async () => {
		if (!canSubmit || !location.lat || !location.lng) return;
		setIsSubmitting(true);
		setError("");
		try {
			const { data } = await postsApi.createPost({
				content: content.trim(),
				mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
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
			setError(msg.toLowerCase().includes("read-only") ? "" : msg);
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
				{accountNotice?.kind === "read_only" && (
					<Alert color="yellow" variant="light" radius="md">
						{accountNotice.message}
					</Alert>
				)}

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
					<Group justify="space-between" align="center" mb={8}>
						<Text
							size="xs"
							c="dimmed"
							fw={600}
							style={{
								textTransform: "uppercase",
								letterSpacing: 0.5
							}}
						>
							Gallery
						</Text>
						<Button
							size="compact-xs"
							variant="subtle"
							color="violet"
							onClick={addMediaInput}
							disabled={
								mediaInputs.length >= MAX_POST_MEDIA_ITEMS
							}
						>
							+ Add image
						</Button>
					</Group>

					<Stack gap="xs">
						{mediaInputs.map((value, index) => (
							<Group key={`media-${index}`} gap={8} wrap="nowrap">
								<TextInput
									style={{ flex: 1 }}
									type="url"
									placeholder="https://images.example.com/your-photo.jpg"
									value={value}
									onChange={(event) =>
										updateMediaInput(
											index,
											event.currentTarget.value
										)
									}
								/>
								{mediaInputs.length > 1 && (
									<ActionIcon
										variant="subtle"
										color="red"
										onClick={() => removeMediaInput(index)}
									>
										✕
									</ActionIcon>
								)}
							</Group>
						))}
					</Stack>

					<Text size="xs" c="dimmed">
						Paste direct image links. Up to {MAX_POST_MEDIA_ITEMS}{" "}
						photos per post.
					</Text>
				</Box>

				{mediaUrls.length > 0 && (
					<PostMediaGallery mediaUrls={mediaUrls} />
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

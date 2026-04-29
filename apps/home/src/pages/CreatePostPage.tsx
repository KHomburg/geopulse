import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
	ActionIcon,
	Alert,
	Badge,
	Box,
	Button,
	Group,
	SegmentedControl,
	Stack,
	Switch,
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
import {
	CameraIcon,
	CloseIcon,
	GalleryIcon,
	SparkIcon
} from "../components/icons";

const ANONYMITY_DATA = [
	{ label: "Public", value: "public" },
	{ label: "Alias", value: "local_legend" },
	{ label: "Anonymous", value: "anonymous" }
];

const MAX_POST_MEDIA_ITEMS = 6;
const MAX_UPLOAD_DIMENSION_PX = 1440;
const IMAGE_UPLOAD_QUALITY = 0.82;

function isMobileCaptureDevice() {
	if (typeof window === "undefined") {
		return false;
	}

	return (
		window.matchMedia("(pointer: coarse)").matches ||
		/Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent)
	);
}

function readFileAsDataUrl(file: File) {
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result ?? ""));
		reader.onerror = () => reject(new Error("Failed to read image"));
		reader.readAsDataURL(file);
	});
}

function loadImage(src: string) {
	return new Promise<HTMLImageElement>((resolve, reject) => {
		const image = new Image();
		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error("Failed to load image"));
		image.src = src;
	});
}

async function fileToPostMediaUrl(file: File) {
	const sourceDataUrl = await readFileAsDataUrl(file);
	const image = await loadImage(sourceDataUrl);
	const longestSide = Math.max(image.width, image.height);
	const scale =
		longestSide > MAX_UPLOAD_DIMENSION_PX
			? MAX_UPLOAD_DIMENSION_PX / longestSide
			: 1;
	const width = Math.max(1, Math.round(image.width * scale));
	const height = Math.max(1, Math.round(image.height * scale));
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext("2d");

	if (!context) {
		return sourceDataUrl;
	}

	context.drawImage(image, 0, 0, width, height);
	return canvas.toDataURL("image/jpeg", IMAGE_UPLOAD_QUALITY);
}

const CreatePostPage = () => {
	const navigate = useNavigate();
	const { location, addPost } = useFeedStore();
	const accountNotice = useAuthStore((state) => state.accountNotice);
	useGeolocation();
	const cameraInputRef = useRef<HTMLInputElement | null>(null);
	const uploadInputRef = useRef<HTMLInputElement | null>(null);

	const [content, setContent] = useState("");
	const [mode, setMode] = useState<AnonymityMode>("public");
	const [pseudonym, setPseudonym] = useState("");
	const [selectedTags, setSelectedTags] = useState<PostTagKey[]>([]);
	const [isSuperLocalLegend, setIsSuperLocalLegend] = useState(false);
	const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
	const [mediaItems, setMediaItems] = useState<string[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		userApi
			.getMe()
			.then(({ data }) => setCurrentUser(data))
			.catch(() => setCurrentUser(null));
	}, []);

	const isWriteBlocked = accountNotice?.kind === "read_only";
	const mediaUrls = mediaItems.slice(0, MAX_POST_MEDIA_ITEMS);
	const isStory = true;
	const prefersCameraCapture = isMobileCaptureDevice();
	const sectionStyle = {
		paddingBottom: 18,
		borderBottom: "1px solid var(--gp-border)"
	} as const;
	const sectionLabelStyle = {
		textTransform: "uppercase",
		letterSpacing: 0.5
	} as const;
	const canSubmit =
		(content.trim().length > 0 || mediaUrls.length > 0) &&
		(mode !== "local_legend" || pseudonym.trim().length > 0) &&
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

	const removeMediaItem = (index: number) => {
		setMediaItems((current) =>
			current.filter((_, itemIndex) => itemIndex !== index)
		);
	};

	const handleOpenImagePicker = () => {
		if (mediaUrls.length >= MAX_POST_MEDIA_ITEMS) {
			setError(
				`You can add up to ${MAX_POST_MEDIA_ITEMS} images to one pulse`
			);
			return;
		}

		setError("");
		if (prefersCameraCapture) {
			cameraInputRef.current?.click();
			return;
		}

		uploadInputRef.current?.click();
	};

	const handleMediaSelection = async (
		event: ChangeEvent<HTMLInputElement>
	) => {
		const files = Array.from(event.currentTarget.files ?? []).filter(
			(file) => file.type.startsWith("image/")
		);
		event.currentTarget.value = "";

		if (!files.length) {
			return;
		}

		const remainingSlots = MAX_POST_MEDIA_ITEMS - mediaUrls.length;
		const nextFiles = files.slice(0, remainingSlots);

		if (nextFiles.length < files.length) {
			setError(
				`Only ${MAX_POST_MEDIA_ITEMS} images can be attached to one pulse`
			);
		}

		try {
			const nextMediaUrls = await Promise.all(
				nextFiles.map((file) => fileToPostMediaUrl(file))
			);
			setMediaItems((current) =>
				[...current, ...nextMediaUrls].slice(0, MAX_POST_MEDIA_ITEMS)
			);
		} catch {
			setError("Could not process that image. Try another one.");
		}
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
				postType: "standard",
				tags: selectedTags,
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
		<Box className="gp-page">
			<Box className="gp-page-header">
				<Box>
					<Text className="gp-page-header__eyebrow">Compose</Text>
					<Text className="gp-page-header__title">New pulse</Text>
				</Box>
			</Box>

			<Box className="gp-scroll" style={{ paddingTop: 8 }}>
				<Stack gap="md">
					{accountNotice?.kind === "read_only" && (
						<Alert color="yellow" variant="light" radius="md">
							{accountNotice.message}
						</Alert>
					)}

					<input
						ref={cameraInputRef}
						type="file"
						accept="image/*"
						capture="environment"
						onChange={handleMediaSelection}
						style={{ display: "none" }}
					/>
					<input
						ref={uploadInputRef}
						type="file"
						accept="image/*"
						multiple
						onChange={handleMediaSelection}
						style={{ display: "none" }}
					/>

					<Box style={sectionStyle}>
						<Stack gap="md">
							<Box>
								<Text
									size="xs"
									c="dimmed"
									mb={8}
									fw={600}
									style={sectionLabelStyle}
								>
									Post as
								</Text>
								<SegmentedControl
									fullWidth
									data={ANONYMITY_DATA}
									value={mode}
									onChange={(val) =>
										setMode(val as AnonymityMode)
									}
								/>
							</Box>

							{mode === "local_legend" && (
								<TextInput
									placeholder="Your alias"
									value={pseudonym}
									onChange={(e) =>
										setPseudonym(e.target.value)
									}
									maxLength={50}
								/>
							)}

							<Textarea
								placeholder="What is happening here?"
								value={content}
								onChange={(e) => setContent(e.target.value)}
								minRows={4}
								maxRows={8}
								maxLength={2000}
								autosize
							/>
						</Stack>
					</Box>

					<Box style={sectionStyle}>
						<Group gap={10} wrap="nowrap" align="center">
							<ActionIcon
								variant="filled"
								color="brand"
								radius="xl"
								size={46}
								onClick={handleOpenImagePicker}
								aria-label={
									prefersCameraCapture
										? "Open camera"
										: "Upload images"
								}
								title={
									prefersCameraCapture
										? "Open camera"
										: "Upload images"
								}
							>
								{prefersCameraCapture ? (
									<CameraIcon size={20} />
								) : (
									<GalleryIcon size={20} />
								)}
							</ActionIcon>

							{mediaUrls.length > 0 && (
								<Group
									gap={8}
									wrap="nowrap"
									style={{
										overflowX: "auto",
										paddingBottom: 2,
										flex: 1,
										minWidth: 0
									}}
								>
									{mediaUrls.map((mediaUrl, index) => (
										<Box
											key={`${index}-${mediaUrl.slice(
												0,
												24
											)}`}
											style={{
												position: "relative",
												width: 72,
												height: 72,
												borderRadius: 12,
												overflow: "hidden",
												border: "1px solid var(--gp-border)",
												background:
													"rgba(255,255,255,0.03)",
												flexShrink: 0
											}}
										>
											<img
												src={mediaUrl}
												alt={`Selected image ${
													index + 1
												}`}
												style={{
													width: "100%",
													height: "100%",
													objectFit: "cover",
													display: "block"
												}}
											/>
											<ActionIcon
												variant="filled"
												size="xs"
												radius="xl"
												color="dark"
												onClick={() =>
													removeMediaItem(index)
												}
												style={{
													position: "absolute",
													top: 6,
													right: 6,
													background:
														"rgba(12,14,18,0.74)",
													color: "#fffaf2"
												}}
												aria-label={`Remove image ${
													index + 1
												}`}
											>
												<CloseIcon size={12} />
											</ActionIcon>
										</Box>
									))}
								</Group>
							)}
						</Group>
					</Box>

					<Box style={sectionStyle}>
						<Box>
							<Text
								size="xs"
								c="dimmed"
								mb={8}
								fw={600}
								style={sectionLabelStyle}
							>
								Vibe tags
							</Text>
							<Group gap={8}>
								{POST_TAGS.map((tag) => {
									const selected = selectedTags.includes(
										tag.key
									);
									return (
										<button
											key={tag.key}
											onClick={() => toggleTag(tag.key)}
											className={`gp-tag-chip ${
												selected
													? "gp-tag-chip--active"
													: ""
											}`}
										>
											<Box
												style={{
													width: 8,
													height: 8,
													borderRadius: 999,
													background: tag.tone,
													display: "inline-block",
													marginRight: 8
												}}
											/>
											{tag.label}
										</button>
									);
								})}
							</Group>
						</Box>
					</Box>

					{mode === "local_legend" &&
						(currentUser?.superPostCredits ?? 0) > 0 && (
							<Box style={sectionStyle}>
								<Group gap={12} align="flex-start">
									<Switch
										checked={isSuperLocalLegend}
										onChange={(event) =>
											setIsSuperLocalLegend(
												event.currentTarget.checked
											)
										}
										color="brand"
									/>
									<Stack gap={0}>
										<Group gap={6} wrap="nowrap">
											<SparkIcon size={16} />
											<Text size="sm" fw={600}>
												Super Local Legend
											</Text>
										</Group>
										<Text size="xs" c="dimmed">
											Pins this post to the top for an
											extra hour.{" "}
											{currentUser?.superPostCredits}{" "}
											credit(s) left.
										</Text>
									</Stack>
								</Group>
							</Box>
						)}

					{mode === "local_legend" &&
						(currentUser?.superPostCredits ?? 0) === 0 && (
							<Badge
								color="yellow"
								variant="light"
								w="fit-content"
							>
								Visit the Karma Shop to unlock Super Local
								Legend boosts
							</Badge>
						)}

					{error && (
						<Alert color="red" variant="light">
							{error}
						</Alert>
					)}

					<Button
						fullWidth
						disabled={!canSubmit}
						loading={isSubmitting}
						onClick={handleSubmit}
					>
						Share story
					</Button>
				</Stack>
			</Box>
		</Box>
	);
};

export default CreatePostPage;

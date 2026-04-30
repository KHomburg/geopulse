import { useEffect, useRef, useCallback, useState } from "react";
import {
	ActionIcon,
	Avatar,
	Badge,
	Box,
	Button,
	Center,
	Group,
	Loader,
	Paper,
	Select,
	Stack,
	Text,
	Textarea,
	Divider
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useFeedStore } from "../store/feed.store";
import { useAuthStore } from "../store/auth.store";
import { postsApi, type Post } from "../api/posts.api";
import { commentsApi, type Comment } from "../api/comments.api";
import { bookmarksApi } from "../api/bookmarks.api";
import { useGeolocation } from "../hooks/useGeolocation";
import { useInboxStore } from "../store/inbox.store";
import { POST_TAGS, type PostTagKey } from "../constants/postTags";
import { getApiErrorMessage } from "../utils/apiErrors";
import PostMediaGallery from "../components/PostMediaGallery";
import {
	AlertIcon,
	AnonymousIcon,
	ArrowDownIcon,
	ArrowUpIcon,
	BellIcon,
	BookmarkFilledIcon,
	BookmarkIcon,
	CommentIcon,
	GlobeIcon,
	LocationIcon,
	RefreshIcon,
	SendIcon,
	TrashIcon
} from "../components/icons";

const FILTER_OPTIONS = [
	{ value: "now", label: "Last hour" },
	{ value: "today", label: "Today" },
	{ value: "week", label: "This week" }
];

function timeAgo(dateStr: string): string {
	const diff = Date.now() - new Date(dateStr).getTime();
	const mins = Math.floor(diff / 60_000);
	if (mins < 1) return "just now";
	if (mins < 60) return `${mins}m ago`;
	const hrs = Math.floor(mins / 60);
	if (hrs < 24) return `${hrs}h ago`;
	return `${Math.floor(hrs / 24)}d ago`;
}

function authorLabel(post: Post): string {
	if (post.anonymityMode === "anonymous") return "Anonymous";
	if (post.anonymityMode === "local_legend")
		return post.authorPseudonym ?? "Local Legend";
	return `User #${post.authorId}`;
}

function anonymityColor(mode: Post["anonymityMode"]): string {
	if (mode === "anonymous") return "gray";
	if (mode === "local_legend") return "brand";
	return "blue";
}

function getTagMeta(tag: string) {
	return POST_TAGS.find((item) => item.key === tag) ?? null;
}

function getAuthorInitials(post: Post) {
	const label = authorLabel(post).replace(/^User\s+#/u, "U");
	const compact = label
		.split(/\s+/u)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("");

	return compact || "GP";
}

function getAuthorAccent(post: Post) {
	if (post.anonymityMode === "anonymous") {
		return "#7a808c";
	}

	if (post.anonymityMode === "local_legend") {
		return "#c4874d";
	}

	return "#65b8b0";
}

interface PostCardProps {
	post: Post;
	onDelete?: (id: number) => void;
}

const CommentItem = ({
	comment,
	postId,
	currentUserId,
	writeBlocked,
	onDeleted
}: {
	comment: Comment;
	postId: number;
	currentUserId: number | null;
	writeBlocked: boolean;
	onDeleted: (id: number) => void;
}) => (
	<Box
		style={{
			paddingLeft: 14,
			marginBottom: 10,
			borderLeft: "1px solid rgba(255,250,242,0.08)"
		}}
	>
		<Group justify="space-between" wrap="nowrap">
			<Group gap={6} wrap="nowrap">
				<Text size="xs" fw={700} style={{ color: "#fffaf2" }}>
					{comment.author?.username ?? `User #${comment.userId}`}
				</Text>
				<Text size="xs" c="dimmed">
					{timeAgo(comment.createdAt)}
				</Text>
			</Group>
			{currentUserId === comment.userId && (
				<ActionIcon
					size="xs"
					variant="subtle"
					color="red"
					disabled={writeBlocked}
					onClick={() =>
						commentsApi
							.deleteComment(postId, comment.id)
							.then(() => onDeleted(comment.id))
					}
				>
					<TrashIcon size={14} />
				</ActionIcon>
			)}
		</Group>
		<Text
			size="xs"
			style={{
				color: "#d7d2c9",
				wordBreak: "break-word",
				lineHeight: 1.55
			}}
		>
			{comment.content}
		</Text>
	</Box>
);

const PostCard = ({ post, onDelete }: PostCardProps) => {
	const { isAuthenticated, userId, accountNotice } = useAuthStore();
	const { votePost } = useFeedStore();
	const isWriteBlocked = accountNotice?.kind === "read_only";
	const writeBlockedMessage =
		accountNotice?.kind === "read_only" ? accountNotice.message : null;
	const [voteError, setVoteError] = useState<string | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);
	const [showComments, setShowComments] = useState(false);
	const [comments, setComments] = useState<Comment[]>([]);
	const [commentCount, setCommentCount] = useState(post.commentCount ?? 0);
	const [loadingComments, setLoadingComments] = useState(false);
	const [newComment, setNewComment] = useState("");
	const [submittingComment, setSubmittingComment] = useState(false);
	const [commentError, setCommentError] = useState<string | null>(null);
	const [bookmarked, setBookmarked] = useState(false);
	const [bookmarkLoading, setBookmarkLoading] = useState(false);

	const clearTransientMessage = (
		setter: React.Dispatch<React.SetStateAction<string | null>>
	) => {
		window.setTimeout(() => setter(null), 3_000);
	};

	const handleVote = async (value: 1 | -1) => {
		if (isWriteBlocked) {
			return;
		}

		try {
			await votePost(post.id, value);
			setVoteError(null);
		} catch (error: unknown) {
			setVoteError(getApiErrorMessage(error, "Vote failed — try again"));
			clearTransientMessage(setVoteError);
		}
	};

	const handleDelete = async () => {
		if (isWriteBlocked) {
			return;
		}

		try {
			await postsApi.deletePost(post.id);
			onDelete?.(post.id);
		} catch (error: unknown) {
			setActionError(getApiErrorMessage(error, "Failed to delete post"));
			clearTransientMessage(setActionError);
		}
	};

	const toggleComments = async () => {
		if (!showComments && comments.length === 0) {
			setLoadingComments(true);
			try {
				const data = await commentsApi.getComments(post.id);
				setComments(data);
			} catch {
				// ignore
			} finally {
				setLoadingComments(false);
			}
		}
		setShowComments((s) => !s);
	};

	const handleAddComment = async () => {
		if (!newComment.trim() || submittingComment || isWriteBlocked) return;
		setSubmittingComment(true);
		try {
			const added = await commentsApi.createComment(
				post.id,
				newComment.trim()
			);
			setComments((prev) => [added, ...prev]);
			setCommentCount((c) => c + 1);
			setNewComment("");
			setCommentError(null);
		} catch (error: unknown) {
			setCommentError(getApiErrorMessage(error, "Failed to add comment"));
			clearTransientMessage(setCommentError);
		} finally {
			setSubmittingComment(false);
		}
	};

	const handleCommentDeleted = (id: number) => {
		setComments((prev) => prev.filter((c) => c.id !== id));
		setCommentCount((c) => Math.max(0, c - 1));
	};

	const toggleBookmark = async () => {
		if (!isAuthenticated || bookmarkLoading || isWriteBlocked) return;
		setBookmarkLoading(true);
		try {
			const result = await bookmarksApi.toggleBookmark(post.id);
			setBookmarked(result.bookmarked);
			setActionError(null);
		} catch (error: unknown) {
			setActionError(
				getApiErrorMessage(error, "Failed to update bookmark")
			);
			clearTransientMessage(setActionError);
		} finally {
			setBookmarkLoading(false);
		}
	};

	return (
		<Paper
			data-testid="post-card"
			className="gp-surface gp-surface--strong"
			style={{
				padding: 18,
				marginBottom: 14,
				borderRadius: 28
			}}
			radius="lg"
		>
			<Group
				justify="space-between"
				mb={14}
				wrap="nowrap"
				align="flex-start"
			>
				<Group gap={10} wrap="nowrap">
					<Avatar
						radius="xl"
						size={46}
						style={{
							background: `linear-gradient(135deg, ${getAuthorAccent(
								post
							)} 0%, rgba(255,255,255,0.08) 100%)`,
							color: "#fffaf2",
							flexShrink: 0,
							border: "1px solid rgba(255,250,242,0.12)"
						}}
					>
						{post.anonymityMode === "anonymous" ? (
							<AnonymousIcon size={18} />
						) : (
							getAuthorInitials(post)
						)}
					</Avatar>
					<Stack gap={4}>
						<Text
							size="sm"
							fw={600}
							style={{
								lineHeight: 1.2,
								fontSize: 15,
								color: post.authorNameColor ?? "#fffaf2"
							}}
						>
							{authorLabel(post)}
						</Text>
						<Group gap={8} className="gp-meta-row">
							<Text size="xs" c="dimmed">
								{timeAgo(post.createdAt)}
							</Text>
							<Text size="xs" c="dimmed">
								{post.postType === "drop" ? "Drop" : "Pulse"}
							</Text>
							<Text size="xs" c="dimmed">
								{post.lat.toFixed(3)}, {post.lng.toFixed(3)}
							</Text>
						</Group>
					</Stack>
				</Group>

				<Group gap={8} wrap="wrap" justify="flex-end">
					<Badge
						variant="light"
						color={anonymityColor(post.anonymityMode)}
						size="xs"
						radius="sm"
					>
						{post.anonymityMode.replace("_", " ")}
					</Badge>
					{post.isStory && (
						<Badge
							variant="filled"
							color="orange"
							size="xs"
							radius="sm"
						>
							Story
						</Badge>
					)}
					{post.postType === "drop" && (
						<Badge
							variant="light"
							color="cyan"
							size="xs"
							radius="sm"
						>
							Drop
						</Badge>
					)}
					{post.isSuperLocalLegend && (
						<Badge
							variant="light"
							color="brand"
							size="xs"
							radius="sm"
						>
							Super
						</Badge>
					)}
				</Group>
			</Group>

			{post.content && (
				<Text
					size="sm"
					style={{
						lineHeight: 1.5,
						marginBottom: 12,
						wordBreak: "break-word"
					}}
				>
					{post.content}
				</Text>
			)}
			{!post.isLocked && post.mediaUrls.length > 0 && (
				<Box mb={12}>
					<PostMediaGallery mediaUrls={post.mediaUrls} />
				</Box>
			)}
			{post.isLocked && (
				<Text size="xs" c="dimmed" mb={12}>
					Hint: {post.previewContent}
				</Text>
			)}
			{post.tags.length > 0 && (
				<Group gap={8} mb={14}>
					{post.tags.map((tag) => {
						const tagDef = getTagMeta(tag);
						return (
							<Box
								key={tag}
								className="gp-tag-chip"
								style={{
									padding: "7px 12px",
									display: "inline-flex",
									alignItems: "center",
									gap: 8,
									color: "#fffaf2"
								}}
							>
								<Box
									style={{
										width: 8,
										height: 8,
										borderRadius: 999,
										background: tagDef?.tone ?? "#c4874d"
									}}
								/>
								<Text size="xs" fw={600} c="inherit">
									{tagDef?.label ?? tag}
								</Text>
							</Box>
						);
					})}
				</Group>
			)}

			<Group justify="space-between" align="center" mt={4}>
				<Group gap={8} wrap="nowrap">
					<ActionIcon
						variant="subtle"
						size="lg"
						disabled={!isAuthenticated || isWriteBlocked}
						onClick={() => handleVote(1)}
						style={{
							color: post.karmaScore > 0 ? "#c4874d" : "#9ca3b0",
							background: "rgba(255,255,255,0.03)"
						}}
					>
						<ArrowUpIcon size={16} />
					</ActionIcon>
					<Text
						size="sm"
						fw={600}
						style={{
							color:
								post.karmaScore > 0
									? "#e7b179"
									: post.karmaScore < 0
									? "#f06b5f"
									: "#9ca3b0",
							minWidth: 20,
							textAlign: "center"
						}}
					>
						{post.karmaScore}
					</Text>
					<ActionIcon
						variant="subtle"
						size="lg"
						disabled={!isAuthenticated || isWriteBlocked}
						onClick={() => handleVote(-1)}
						style={{
							color: post.karmaScore < 0 ? "#f06b5f" : "#9ca3b0",
							background: "rgba(255,255,255,0.03)"
						}}
					>
						<ArrowDownIcon size={16} />
					</ActionIcon>
					{voteError && (
						<Text size="xs" c="red">
							{voteError}
						</Text>
					)}
					<ActionIcon
						variant="subtle"
						size="lg"
						onClick={toggleComments}
						style={{
							color: showComments ? "#65b8b0" : "#9ca3b0",
							background: "rgba(255,255,255,0.03)"
						}}
					>
						<CommentIcon size={16} />
					</ActionIcon>
					<Text size="xs" c="dimmed">
						{commentCount}
					</Text>
				</Group>

				<Group gap={6} wrap="nowrap">
					<Box
						className="gp-mini-pill"
						style={{ padding: "7px 10px" }}
					>
						<LocationIcon size={14} />
						<Text size="xs" c="inherit">
							{post.lat.toFixed(3)}, {post.lng.toFixed(3)}
						</Text>
					</Box>

					{isAuthenticated && (
						<ActionIcon
							variant="subtle"
							size="lg"
							onClick={toggleBookmark}
							disabled={bookmarkLoading || isWriteBlocked}
							style={{
								color: bookmarked ? "#c4874d" : "#9ca3b0",
								background: "rgba(255,255,255,0.03)"
							}}
							title={
								bookmarked ? "Remove bookmark" : "Save bookmark"
							}
						>
							{bookmarked ? (
								<BookmarkFilledIcon size={16} />
							) : (
								<BookmarkIcon size={16} />
							)}
						</ActionIcon>
					)}

					{post.isOwner && (
						<ActionIcon
							color="red"
							variant="subtle"
							size="lg"
							disabled={isWriteBlocked}
							onClick={handleDelete}
							title="Delete post"
							style={{ background: "rgba(255,255,255,0.03)" }}
						>
							<TrashIcon size={16} />
						</ActionIcon>
					)}
				</Group>
			</Group>

			{actionError && (
				<Text size="xs" c="red" mt={8}>
					{actionError}
				</Text>
			)}

			{showComments && (
				<Box mt={12}>
					<Divider mb={10} color="#2a2a2a" />
					{isAuthenticated && (
						<>
							{writeBlockedMessage && (
								<Text size="xs" c="yellow" mb={8}>
									{writeBlockedMessage}
								</Text>
							)}
							<Group
								gap={8}
								mb={12}
								wrap="nowrap"
								align="flex-end"
							>
								<Textarea
									placeholder={
										isWriteBlocked
											? "Commenting is disabled while your account is read-only"
											: "Write a comment…"
									}
									value={newComment}
									disabled={isWriteBlocked}
									onChange={(e) =>
										setNewComment(e.currentTarget.value)
									}
									onKeyDown={(e) => {
										if (e.key === "Enter" && !e.shiftKey) {
											e.preventDefault();
											handleAddComment();
										}
									}}
									autosize
									minRows={1}
									maxRows={3}
									style={{ flex: 1 }}
									styles={{
										input: {
											background: "#1a1a1a",
											border: "1px solid #2a2a2a",
											color: "#f0f0f0",
											fontSize: 13
										}
									}}
								/>
								<ActionIcon
									variant="filled"
									style={{
										background:
											"linear-gradient(135deg, #c4874d, #e7b179)",
										color: "#17120d"
									}}
									size="lg"
									disabled={
										isWriteBlocked ||
										!newComment.trim() ||
										submittingComment
									}
									onClick={handleAddComment}
								>
									<SendIcon size={16} />
								</ActionIcon>
							</Group>
							{commentError && (
								<Text size="xs" c="red" mb={8}>
									{commentError}
								</Text>
							)}
						</>
					)}
					{loadingComments ? (
						<Center py={12}>
							<Loader size="xs" color="violet" />
						</Center>
					) : comments.length === 0 ? (
						<Text size="xs" c="dimmed" ta="center" py={8}>
							No comments yet
						</Text>
					) : (
						<Stack gap={4}>
							{comments.map((c) => (
								<CommentItem
									key={c.id}
									comment={c}
									postId={post.id}
									currentUserId={userId}
									writeBlocked={isWriteBlocked}
									onDeleted={handleCommentDeleted}
								/>
							))}
						</Stack>
					)}
				</Box>
			)}
		</Paper>
	);
};

const FeedPage = () => {
	const navigate = useNavigate();
	const unreadNotifications = useInboxStore(
		(state) => state.unreadNotifications
	);
	const {
		posts,
		filter,
		selectedTags,
		setFilter,
		setTags,
		loadFeed,
		isLoadingFeed,
		hasMore,
		removePost,
		location,
		feedError,
		radiusKm
	} = useFeedStore();
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const bottomRef = useRef<HTMLDivElement>(null);
	useGeolocation();

	const handleFilterChange = useCallback(
		(value: string | null) => {
			if (value) setFilter(value as "now" | "today" | "week");
		},
		[setFilter]
	);

	const toggleTag = (tag: PostTagKey) => {
		if (selectedTags.includes(tag)) {
			setTags(selectedTags.filter((item) => item !== tag));
			return;
		}
		setTags([...selectedTags, tag]);
	};

	useEffect(() => {
		if (location.lat && location.lng) loadFeed(true);
	}, [location, filter, selectedTags, loadFeed]);

	useEffect(() => {
		const el = bottomRef.current;
		if (!el) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMore && !isLoadingFeed)
					loadFeed();
			},
			{ threshold: 0.1 }
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, [hasMore, isLoadingFeed, loadFeed]);

	return (
		<Box className="gp-page">
			<Box className="gp-page-header">
				<Group justify="space-between" align="center">
					<Box>
						<Text className="gp-page-header__eyebrow">
							Local pulse
						</Text>
						<Text className="gp-page-header__title">Feed</Text>
						<Text className="gp-page-header__subtitle">
							Nearby stories, drops, and visual updates arranged
							with more clarity.
						</Text>
					</Box>
					<Group gap={8} wrap="nowrap">
						<Select
							data={FILTER_OPTIONS}
							value={filter}
							onChange={handleFilterChange}
							size="xs"
							style={{ width: 110 }}
						/>
						<Box style={{ position: "relative" }}>
							<ActionIcon
								variant="subtle"
								radius="xl"
								size="lg"
								onClick={() => navigate("/notifications")}
								style={{
									color: "#fffaf2",
									background: "rgba(255,255,255,0.05)"
								}}
							>
								<BellIcon size={18} />
							</ActionIcon>
							{unreadNotifications > 0 && (
								<Box
									style={{
										position: "absolute",
										top: -3,
										right: -2,
										minWidth: 16,
										height: 16,
										padding: "0 4px",
										borderRadius: 999,
										background: "#ff6584",
										color: "#fff",
										fontSize: 10,
										fontWeight: 700,
										display: "flex",
										alignItems: "center",
										justifyContent: "center"
									}}
								>
									{Math.min(unreadNotifications, 99)}
								</Box>
							)}
						</Box>
					</Group>
				</Group>
				<Group className="gp-chip-row" mt={10} wrap="nowrap">
					{POST_TAGS.map((tag) => {
						const selected = selectedTags.includes(tag.key);
						return (
							<button
								key={tag.key}
								onClick={() => toggleTag(tag.key)}
								className={`gp-tag-chip ${
									selected ? "gp-tag-chip--active" : ""
								}`}
								style={{
									color: selected ? "#fffaf2" : undefined
								}}
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

			<Box className="gp-scroll" style={{ paddingTop: 16 }}>
				{!location.lat ? (
					<Box className="gp-empty-state">
						<Box className="gp-empty-state__icon">
							<LocationIcon size={24} />
						</Box>
						<Loader color="brand" size="sm" />
						<Box className="gp-empty-state__copy">
							<Text fw={700}>Getting your location</Text>
							<Text c="dimmed" size="sm">
								The feed locks onto what is happening around
								you, so it needs your current position before
								the first pulse can load.
							</Text>
						</Box>
						<Box className="gp-empty-state__actions">
							<Button
								variant="light"
								color="brand"
								onClick={() => navigate("/map")}
							>
								Open map instead
							</Button>
						</Box>
					</Box>
				) : feedError ? (
					<Box className="gp-empty-state">
						<Box className="gp-empty-state__icon">
							<AlertIcon size={24} />
						</Box>
						<Box className="gp-empty-state__copy">
							<Text fw={700}>Feed unavailable</Text>
							<Text c="red" size="sm">
								{feedError}
							</Text>
							<Text c="dimmed" size="sm">
								Retry the nearby feed or jump to the map while
								the list refreshes.
							</Text>
						</Box>
						<Box className="gp-empty-state__actions">
							<Button
								onClick={() => void loadFeed(true)}
								leftSection={<RefreshIcon size={14} />}
							>
								Retry feed
							</Button>
							<Button
								variant="light"
								color="brand"
								onClick={() => navigate("/map")}
							>
								View map
							</Button>
						</Box>
					</Box>
				) : posts.length === 0 && !isLoadingFeed ? (
					<Box className="gp-empty-state">
						<Box className="gp-empty-state__icon">
							<GlobeIcon size={24} />
						</Box>
						<Box className="gp-empty-state__copy">
							<Text fw={700}>Nothing nearby yet</Text>
							<Text c="dimmed" size="sm">
								You are scanning{" "}
								{filter === "now"
									? "the last hour"
									: filter === "week"
									? "this week"
									: "today"}{" "}
								within {radiusKm} km.
								{selectedTags.length > 0
									? ` ${selectedTags.length} vibe filter${
											selectedTags.length === 1
												? " is"
												: "s are"
									  } active right now.`
									: " Try a different timeframe or seed the area with your own pulse."}
							</Text>
						</Box>
						<Box className="gp-empty-state__actions">
							<Button
								onClick={() =>
									navigate(
										isAuthenticated ? "/post/new" : "/login"
									)
								}
							>
								{isAuthenticated
									? "Create a pulse"
									: "Sign in to post"}
							</Button>
							<Button
								variant="light"
								color="brand"
								onClick={() => navigate("/map")}
							>
								Open map
							</Button>
						</Box>
					</Box>
				) : (
					posts.map((post) => (
						<PostCard
							key={post.id}
							post={post}
							onDelete={removePost}
						/>
					))
				)}

				<div ref={bottomRef} />

				{isLoadingFeed && (
					<Center py={20}>
						<Loader color="violet" size="sm" />
					</Center>
				)}

				{!hasMore && posts.length > 0 && (
					<Text ta="center" size="xs" c="dimmed" py={16}>
						No more posts in this area
					</Text>
				)}
			</Box>
		</Box>
	);
};

export default FeedPage;

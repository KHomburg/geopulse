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
	if (mode === "local_legend") return "violet";
	return "blue";
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
			borderLeft: "2px solid #2a2a2a",
			paddingLeft: 10,
			marginBottom: 8
		}}
	>
		<Group justify="space-between" wrap="nowrap">
			<Group gap={6} wrap="nowrap">
				<Text size="xs" fw={600} style={{ color: "#b0b0b0" }}>
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
					✕
				</ActionIcon>
			)}
		</Group>
		<Text size="xs" style={{ color: "#d0d0d0", wordBreak: "break-word" }}>
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
			style={{
				background: "#141414",
				border: "1px solid #2a2a2a",
				padding: 16,
				marginBottom: 12
			}}
			radius="lg"
		>
			<Group justify="space-between" mb={10} wrap="nowrap">
				<Group gap={10} wrap="nowrap">
					<Avatar
						radius="xl"
						size="sm"
						color="violet"
						style={{ background: "#2a2a2a", flexShrink: 0 }}
					>
						{post.anonymityMode === "anonymous"
							? "?"
							: post.authorPinAvatar ??
							  (post.postType === "drop" ? "🎁" : "📍")}
					</Avatar>
					<Stack gap={0}>
						<Text
							size="sm"
							fw={600}
							style={{
								lineHeight: 1.3,
								color: post.authorNameColor ?? "#f0f0f0"
							}}
						>
							{authorLabel(post)}
						</Text>
						<Text size="xs" c="dimmed">
							{timeAgo(post.createdAt)}
						</Text>
					</Stack>
				</Group>

				<Group gap={6} wrap="nowrap">
					<Badge
						variant="outline"
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
							variant="filled"
							color="teal"
							size="xs"
							radius="sm"
						>
							Drop
						</Badge>
					)}
					{post.isSuperLocalLegend && (
						<Badge
							variant="filled"
							color="yellow"
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
				<Group gap={6} mb={12}>
					{post.tags.map((tag) => {
						const tagDef = POST_TAGS.find(
							(item) => item.key === tag
						);
						return (
							<Badge
								key={tag}
								variant="outline"
								color="gray"
								size="xs"
							>
								{tagDef?.icon ?? "#"} {tagDef?.label ?? tag}
							</Badge>
						);
					})}
				</Group>
			)}

			<Group justify="space-between" align="center" mt={4}>
				<Group gap={6} wrap="nowrap">
					<ActionIcon
						variant="subtle"
						size="sm"
						disabled={!isAuthenticated || isWriteBlocked}
						onClick={() => handleVote(1)}
						style={{
							color: post.karmaScore > 0 ? "#6c63ff" : "#555"
						}}
					>
						▲
					</ActionIcon>
					<Text
						size="sm"
						fw={600}
						style={{
							color:
								post.karmaScore > 0
									? "#6c63ff"
									: post.karmaScore < 0
									? "#ff4757"
									: "#888",
							minWidth: 20,
							textAlign: "center"
						}}
					>
						{post.karmaScore}
					</Text>
					<ActionIcon
						variant="subtle"
						size="sm"
						disabled={!isAuthenticated || isWriteBlocked}
						onClick={() => handleVote(-1)}
						style={{
							color: post.karmaScore < 0 ? "#ff4757" : "#555"
						}}
					>
						▼
					</ActionIcon>
					{voteError && (
						<Text size="xs" c="red">
							{voteError}
						</Text>
					)}
					<ActionIcon
						variant="subtle"
						size="sm"
						onClick={toggleComments}
						style={{ color: showComments ? "#6c63ff" : "#666" }}
					>
						💬
					</ActionIcon>
					<Text size="xs" c="dimmed">
						{commentCount}
					</Text>
				</Group>

				<Group gap={6} wrap="nowrap">
					<Text size="xs" c="dimmed">
						📍 {post.lat.toFixed(3)}, {post.lng.toFixed(3)}
					</Text>

					{isAuthenticated && (
						<ActionIcon
							variant="subtle"
							size="sm"
							onClick={toggleBookmark}
							disabled={bookmarkLoading || isWriteBlocked}
							style={{ color: bookmarked ? "#6c63ff" : "#555" }}
							title={
								bookmarked ? "Remove bookmark" : "Save bookmark"
							}
						>
							{bookmarked ? "🔖" : "🏷"}
						</ActionIcon>
					)}

					{post.isOwner && (
						<ActionIcon
							color="red"
							variant="subtle"
							size="sm"
							disabled={isWriteBlocked}
							onClick={handleDelete}
							title="Delete post"
						>
							✕
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
										background: "#6c63ff",
										color: "white"
									}}
									size="lg"
									disabled={
										isWriteBlocked ||
										!newComment.trim() ||
										submittingComment
									}
									onClick={handleAddComment}
								>
									↑
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
		feedError
	} = useFeedStore();
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
		<Box
			style={{
				height: "100%",
				display: "flex",
				flexDirection: "column",
				background: "#0a0a0a"
			}}
		>
			<Box
				style={{
					position: "sticky",
					top: 0,
					zIndex: 10,
					background: "rgba(10,10,10,0.95)",
					backdropFilter: "blur(12px)",
					borderBottom: "1px solid #2a2a2a",
					padding: "12px 16px"
				}}
			>
				<Group justify="space-between" align="center">
					<Text fw={700} size="md" style={{ color: "#f0f0f0" }}>
						Pulse Feed
					</Text>
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
									color: "#f0f0f0",
									background: "rgba(255,255,255,0.04)"
								}}
							>
								🔔
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
				<Group
					gap={8}
					mt={10}
					wrap="nowrap"
					style={{ overflowX: "auto" }}
				>
					{POST_TAGS.map((tag) => {
						const selected = selectedTags.includes(tag.key);
						return (
							<Button
								key={tag.key}
								size="compact-xs"
								variant={selected ? "filled" : "subtle"}
								color={selected ? "violet" : "gray"}
								onClick={() => toggleTag(tag.key)}
							>
								{tag.icon} {tag.label}
							</Button>
						);
					})}
				</Group>
			</Box>

			<Box style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
				{!location.lat ? (
					<Center style={{ paddingTop: 80 }}>
						<Stack align="center" gap="sm">
							<Loader color="violet" size="sm" />
							<Text c="dimmed" size="sm">
								Acquiring location…
							</Text>
						</Stack>
					</Center>
				) : feedError ? (
					<Center style={{ paddingTop: 80 }}>
						<Stack align="center" gap="sm">
							<Text size="xl">⚠️</Text>
							<Text c="red" size="sm">
								{feedError}
							</Text>
							<ActionIcon
								variant="subtle"
								color="violet"
								onClick={() => loadFeed(true)}
							>
								↻
							</ActionIcon>
						</Stack>
					</Center>
				) : posts.length === 0 && !isLoadingFeed ? (
					<Center style={{ paddingTop: 80 }}>
						<Stack align="center" gap="sm">
							<Text size="xl">📡</Text>
							<Text c="dimmed" size="sm">
								No pulses in this area yet
							</Text>
						</Stack>
					</Center>
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

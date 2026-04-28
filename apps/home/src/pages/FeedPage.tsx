import { useEffect, useRef, useCallback, useState } from "react";
import {
	ActionIcon,
	Avatar,
	Badge,
	Box,
	Center,
	Group,
	Loader,
	Paper,
	Select,
	Stack,
	Text
} from "@mantine/core";
import { useFeedStore } from "../store/feed.store";
import { useAuthStore } from "../store/auth.store";
import { postsApi, type Post } from "../api/posts.api";
import { useGeolocation } from "../hooks/useGeolocation";

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

const PostCard = ({ post, onDelete }: PostCardProps) => {
	const { isAuthenticated } = useAuthStore();
	const { votePost } = useFeedStore();
	const [voteError, setVoteError] = useState<string | null>(null);

	const handleVote = async (value: 1 | -1) => {
		try {
			await votePost(post.id, value);
		} catch {
			setVoteError("Vote failed — try again");
			setTimeout(() => setVoteError(null), 3000);
		}
	};

	const handleDelete = async () => {
		try {
			await postsApi.deletePost(post.id);
			onDelete?.(post.id);
		} catch {
			// Ignore
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
						{post.anonymityMode === "anonymous" ? "?" : "●"}
					</Avatar>
					<Stack gap={0}>
						<Text size="sm" fw={600} style={{ lineHeight: 1.3 }}>
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
				</Group>
			</Group>

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

			<Group justify="space-between" align="center" mt={4}>
				<Group gap={6} wrap="nowrap">
					<ActionIcon
						variant="subtle"
						size="sm"
						disabled={!isAuthenticated}
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
						disabled={!isAuthenticated}
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
				</Group>

				<Text size="xs" c="dimmed">
					📍 {post.lat.toFixed(3)}, {post.lng.toFixed(3)}
				</Text>

				{post.isOwner && (
					<ActionIcon
						color="red"
						variant="subtle"
						size="sm"
						onClick={handleDelete}
						title="Delete post"
					>
						✕
					</ActionIcon>
				)}
			</Group>
		</Paper>
	);
};

const FeedPage = () => {
	const {
		posts,
		filter,
		setFilter,
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

	useEffect(() => {
		if (location.lat && location.lng) loadFeed(true);
	}, [location, filter, loadFeed]);

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
					<Select
						data={FILTER_OPTIONS}
						value={filter}
						onChange={handleFilterChange}
						size="xs"
						style={{ width: 110 }}
					/>
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

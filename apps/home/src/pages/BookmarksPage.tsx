import { useEffect, useState } from "react";
import {
	Box,
	Center,
	Loader,
	Stack,
	Text,
	Paper,
	Group,
	Avatar,
	Badge
} from "@mantine/core";
import { bookmarksApi } from "../api/bookmarks.api";
import type { Post } from "../api/posts.api";

function timeAgo(dateStr: string): string {
	const diff = Date.now() - new Date(dateStr).getTime();
	const mins = Math.floor(diff / 60_000);
	if (mins < 1) return "just now";
	if (mins < 60) return `${mins}m ago`;
	const hrs = Math.floor(mins / 60);
	if (hrs < 24) return `${hrs}h ago`;
	return `${Math.floor(hrs / 24)}d ago`;
}

const BookmarkCard = ({ post }: { post: Post }) => (
	<Paper
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
						{post.anonymityMode === "anonymous"
							? "Anonymous"
							: post.anonymityMode === "local_legend"
							? post.authorPseudonym ?? "Local Legend"
							: `User #${post.authorId}`}
					</Text>
					<Text size="xs" c="dimmed">
						{timeAgo(post.createdAt)}
					</Text>
				</Stack>
			</Group>
			<Group gap={6} wrap="nowrap">
				<Badge
					variant="outline"
					color={
						post.anonymityMode === "anonymous"
							? "gray"
							: post.anonymityMode === "local_legend"
							? "violet"
							: "blue"
					}
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
		<Text size="sm" style={{ lineHeight: 1.5, wordBreak: "break-word" }}>
			{post.content}
		</Text>
		<Group justify="space-between" mt={10}>
			<Text size="xs" style={{ color: "#6c63ff" }} fw={600}>
				▲ {post.karmaScore}
			</Text>
			<Text size="xs" c="dimmed">
				📍 {post.lat.toFixed(3)}, {post.lng.toFixed(3)}
			</Text>
			<Text size="xs" c="dimmed">
				💬 {post.commentCount}
			</Text>
		</Group>
	</Paper>
);

const BookmarksPage = () => {
	const [posts, setPosts] = useState<Post[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		bookmarksApi
			.getMyBookmarks()
			.then(setPosts)
			.catch(() => setError("Failed to load bookmarks"))
			.finally(() => setLoading(false));
	}, []);

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
				<Text fw={700} size="md" style={{ color: "#f0f0f0" }}>
					🔖 Saved Posts
				</Text>
			</Box>

			<Box style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
				{loading ? (
					<Center pt={80}>
						<Loader color="violet" size="sm" />
					</Center>
				) : error ? (
					<Center pt={80}>
						<Text c="red" size="sm">
							{error}
						</Text>
					</Center>
				) : posts.length === 0 ? (
					<Center pt={80}>
						<Stack align="center" gap="sm">
							<Text size="xl">🔖</Text>
							<Text c="dimmed" size="sm">
								No saved posts yet
							</Text>
							<Text c="dimmed" size="xs">
								Tap the bookmark icon on any post to save it
							</Text>
						</Stack>
					</Center>
				) : (
					posts.map((post) => (
						<BookmarkCard key={post.id} post={post} />
					))
				)}
			</Box>
		</Box>
	);
};

export default BookmarksPage;

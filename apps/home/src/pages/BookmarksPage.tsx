import { useEffect, useState } from "react";
import {
	ActionIcon,
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
import PostMediaGallery from "../components/PostMediaGallery";
import {
	AnonymousIcon,
	BookmarkFilledIcon,
	GlobeIcon,
	LocationIcon,
	SparkIcon
} from "../components/icons";

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
		className="gp-surface gp-surface--strong"
		style={{
			padding: 18,
			marginBottom: 14,
			borderRadius: 28
		}}
		radius="lg"
	>
		<Group justify="space-between" mb={12} wrap="nowrap" align="flex-start">
			<Group gap={10} wrap="nowrap">
				<Avatar
					radius="xl"
					size={44}
					style={{
						background:
							post.anonymityMode === "anonymous"
								? "linear-gradient(135deg, #7a808c 0%, rgba(255,255,255,0.08) 100%)"
								: post.anonymityMode === "local_legend"
								? "linear-gradient(135deg, #c4874d 0%, rgba(255,255,255,0.08) 100%)"
								: "linear-gradient(135deg, #65b8b0 0%, rgba(255,255,255,0.08) 100%)",
						color: "#fffaf2",
						flexShrink: 0,
						border: "1px solid rgba(255,250,242,0.12)"
					}}
				>
					{post.anonymityMode === "anonymous" ? (
						<AnonymousIcon size={18} />
					) : post.anonymityMode === "local_legend" ? (
						<SparkIcon size={18} />
					) : (
						<GlobeIcon size={18} />
					)}
				</Avatar>
				<Stack gap={4}>
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
					<Box
						className="gp-mini-pill"
						style={{ padding: "6px 10px" }}
					>
						<LocationIcon size={14} />
						<Text size="xs" c="inherit">
							{post.lat.toFixed(3)}, {post.lng.toFixed(3)}
						</Text>
					</Box>
				</Stack>
			</Group>
			<Group gap={6} wrap="nowrap">
				<Badge
					variant="light"
					color={
						post.anonymityMode === "anonymous"
							? "gray"
							: post.anonymityMode === "local_legend"
							? "brand"
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
		{post.content && (
			<Text
				size="sm"
				style={{ lineHeight: 1.5, wordBreak: "break-word" }}
			>
				{post.content}
			</Text>
		)}
		{post.mediaUrls.length > 0 && (
			<Box mt={12}>
				<PostMediaGallery mediaUrls={post.mediaUrls} />
			</Box>
		)}
		<Group justify="space-between" mt={14}>
			<Box className="gp-mini-pill">Score {post.karmaScore}</Box>
			<Box className="gp-mini-pill">Comments {post.commentCount}</Box>
			<ActionIcon
				variant="filled"
				size="lg"
				title="Saved post"
				style={{ pointerEvents: "none" }}
			>
				<BookmarkFilledIcon size={16} />
			</ActionIcon>
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
		<Box className="gp-page">
			<Box className="gp-page-header">
				<Text className="gp-page-header__eyebrow">Library</Text>
				<Text className="gp-page-header__title">Bookmarks</Text>
				<Text className="gp-page-header__subtitle">
					Your saved posts now live in the same polished card system
					as the main feed.
				</Text>
			</Box>

			<Box className="gp-scroll" style={{ paddingTop: 16 }}>
				{loading ? (
					<Center pt={80}>
						<Loader color="violet" size="sm" />
					</Center>
				) : error ? (
					<Box className="gp-empty-state">
						<Box className="gp-empty-state__icon">
							<BookmarkFilledIcon size={24} />
						</Box>
						<Text fw={700}>Bookmarks unavailable</Text>
						<Text c="red" size="sm">
							{error}
						</Text>
					</Box>
				) : posts.length === 0 ? (
					<Box className="gp-empty-state">
						<Box className="gp-empty-state__icon">
							<BookmarkFilledIcon size={24} />
						</Box>
						<Text fw={700}>No saved posts yet</Text>
						<Text c="dimmed" size="sm">
							Save visual posts or local drops from the feed to
							build a cleaner personal archive.
						</Text>
					</Box>
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

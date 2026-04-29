import { useCallback, useEffect, useState } from "react";
import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Center,
	Group,
	Loader,
	Paper,
	Stack,
	Text,
	TextInput
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { postsApi, type Post } from "../api/posts.api";
import { roomsApi, type RoomMessage } from "../api/rooms.api";
import { subscribeRealtime } from "../realtime/realtime.client";
import { useFeedStore } from "../store/feed.store";
import { useAuthStore } from "../store/auth.store";
import { useGeolocation } from "../hooks/useGeolocation";
import { getApiErrorMessage } from "../utils/apiErrors";

function timeAgo(dateStr: string) {
	const diff = Date.now() - new Date(dateStr).getTime();
	const mins = Math.floor(diff / 60_000);
	if (mins < 1) return "just now";
	if (mins < 60) return `${mins}m ago`;
	const hrs = Math.floor(mins / 60);
	if (hrs < 24) return `${hrs}h ago`;
	return `${Math.floor(hrs / 24)}d ago`;
}

const TrustedLocalsPage = () => {
	const navigate = useNavigate();
	const location = useFeedStore((state) => state.location);
	const accountNotice = useAuthStore((state) => state.accountNotice);
	const isWriteBlocked = accountNotice?.kind === "read_only";
	const [posts, setPosts] = useState<Post[]>([]);
	const [messages, setMessages] = useState<RoomMessage[]>([]);
	const [loading, setLoading] = useState(true);
	const [message, setMessage] = useState("");
	const [error, setError] = useState<string | null>(null);
	useGeolocation();

	const load = useCallback(async () => {
		if (location.lat == null || location.lng == null) return;
		setLoading(true);
		setError(null);
		try {
			const [{ data: trustedFeed }, { data: roomData }] =
				await Promise.all([
					postsApi.getTrustedFeed({
						lat: location.lat,
						lng: location.lng,
						radiusKm: 8,
						filter: "today",
						limit: 8,
						offset: 0
					}),
					roomsApi.getTrustedMessages()
				]);
			setPosts(trustedFeed.data);
			setMessages(roomData.data);
		} catch (err: unknown) {
			const messageText =
				(err as { response?: { data?: { message?: string } } })
					?.response?.data?.message ??
				"Trusted Locals is locked right now";
			setError(messageText);
		} finally {
			setLoading(false);
		}
	}, [location.lat, location.lng]);

	useEffect(() => {
		void load();
	}, [load]);

	useEffect(() => {
		return subscribeRealtime((event) => {
			if (
				event.type === "room:message:new" &&
				event.data.roomType === "trusted_locals"
			) {
				setMessages((prev) =>
					prev.some((item) => item.id === event.data.message.id)
						? prev
						: [...prev, event.data.message]
				);
			}
		});
	}, []);

	const handleSend = async () => {
		if (!message.trim() || isWriteBlocked) return;
		try {
			const { data } = await roomsApi.sendTrustedMessage(message.trim());
			setMessages((prev) =>
				prev.some((item) => item.id === data.id)
					? prev
					: [...prev, data]
			);
			setMessage("");
			setError(null);
		} catch (err: unknown) {
			setError(
				getApiErrorMessage(err, "Failed to send trusted locals message")
			);
		}
	};

	return (
		<Box
			style={{
				height: "100%",
				background: "#0a0a0a",
				display: "flex",
				flexDirection: "column"
			}}
		>
			<Box style={{ padding: "16px" }}>
				<Group justify="space-between" mb={12}>
					<Button
						variant="subtle"
						color="gray"
						onClick={() => navigate(-1)}
					>
						← Back
					</Button>
					<Badge color="green" variant="light">
						500+ karma zone
					</Badge>
				</Group>
				<Text fw={800} size="xl">
					Trusted Locals
				</Text>
				<Text size="sm" c="dimmed">
					High-signal local feed plus a gated community chat.
				</Text>
			</Box>

			{loading ? (
				<Center style={{ flex: 1 }}>
					<Loader color="violet" />
				</Center>
			) : error ? (
				<Center style={{ flex: 1 }} px={24}>
					<Stack align="center" gap="sm">
						<Text size="xl">🔒</Text>
						<Text fw={700}>{error}</Text>
						<Text size="sm" c="dimmed" ta="center">
							Keep contributing nearby and building karma to
							unlock this room.
						</Text>
					</Stack>
				</Center>
			) : (
				<Box
					style={{
						flex: 1,
						overflowY: "auto",
						padding: "0 16px 16px"
					}}
				>
					<Stack gap="md">
						<Paper
							radius="lg"
							style={{
								background: "#141414",
								border: "1px solid #2a2a2a",
								padding: 14
							}}
						>
							<Text fw={700} mb={10}>
								Top local posts
							</Text>
							<Stack gap="xs">
								{posts.slice(0, 4).map((post) => (
									<Box key={post.id}>
										<Group justify="space-between" mb={4}>
											<Text
												fw={600}
												style={{
													color:
														post.authorNameColor ??
														"#f0f0f0"
												}}
											>
												{post.authorPseudonym ??
													`User #${post.authorId}`}
											</Text>
											<Text size="xs" c="dimmed">
												{timeAgo(post.createdAt)}
											</Text>
										</Group>
										<Text size="sm" c="dimmed">
											{post.previewContent}
										</Text>
									</Box>
								))}
							</Stack>
						</Paper>

						<Paper
							radius="lg"
							style={{
								background: "#141414",
								border: "1px solid #2a2a2a",
								padding: 14
							}}
						>
							<Text fw={700} mb={10}>
								Room chat
							</Text>
							{accountNotice?.kind === "read_only" && (
								<Text size="xs" c="yellow" mb={10}>
									{accountNotice.message}
								</Text>
							)}
							<Stack gap="xs" mb={12}>
								{messages.map((item) => (
									<Box key={item.id}>
										<Text
											size="sm"
											fw={600}
											style={{
												color:
													item.author
														?.usernameColor ??
													"#f0f0f0"
											}}
										>
											{item.author?.displayName ??
												item.author?.username ??
												`User #${item.userId}`}
										</Text>
										<Text size="sm">{item.content}</Text>
									</Box>
								))}
							</Stack>
							<Group wrap="nowrap">
								<TextInput
									style={{ flex: 1 }}
									placeholder={
										isWriteBlocked
											? "Room chat is disabled while your account is read-only"
											: "Share what locals should know"
									}
									value={message}
									disabled={isWriteBlocked}
									onChange={(event) =>
										setMessage(event.currentTarget.value)
									}
									onKeyDown={(event) => {
										if (event.key === "Enter") {
											event.preventDefault();
											void handleSend();
										}
									}}
								/>
								<ActionIcon
									variant="filled"
									color="violet"
									disabled={isWriteBlocked || !message.trim()}
									onClick={() => void handleSend()}
								>
									↑
								</ActionIcon>
							</Group>
						</Paper>
					</Stack>
				</Box>
			)}
		</Box>
	);
};

export default TrustedLocalsPage;

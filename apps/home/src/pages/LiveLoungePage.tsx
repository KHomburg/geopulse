import { useCallback, useEffect, useMemo, useState } from "react";
import {
	ActionIcon,
	Box,
	Button,
	Group,
	Paper,
	Stack,
	Text,
	TextInput
} from "@mantine/core";
import { useNavigate, useParams } from "react-router-dom";
import { roomsApi, type LiveLounge, type RoomMessage } from "../api/rooms.api";
import { subscribeRealtime } from "../realtime/realtime.client";
import { useFeedStore } from "../store/feed.store";
import { useGeolocation } from "../hooks/useGeolocation";

const LiveLoungePage = () => {
	const { roomKey = "" } = useParams<{ roomKey: string }>();
	const navigate = useNavigate();
	const location = useFeedStore((state) => state.location);
	const [messages, setMessages] = useState<RoomMessage[]>([]);
	const [lounges, setLounges] = useState<LiveLounge[]>([]);
	const [content, setContent] = useState("");
	const [mediaUrl, setMediaUrl] = useState("");
	const [error, setError] = useState<string | null>(null);
	useGeolocation();

	const currentLounge = useMemo(
		() => lounges.find((lounge) => lounge.roomKey === roomKey) ?? null,
		[lounges, roomKey]
	);

	const load = useCallback(async () => {
		if (location.lat == null || location.lng == null || !roomKey) return;
		try {
			const [{ data: loungeData }, { data: messageData }] =
				await Promise.all([
					roomsApi.getLiveLounges({
						lat: location.lat,
						lng: location.lng
					}),
					roomsApi.getLiveLoungeMessages(roomKey, {
						lat: location.lat,
						lng: location.lng
					})
				]);
			setLounges(loungeData.data);
			setMessages(messageData.data);
			setError(null);
		} catch (err: unknown) {
			const messageText =
				(err as { response?: { data?: { message?: string } } })
					?.response?.data?.message ??
				"You need to be inside this live lounge to join";
			setError(messageText);
		}
	}, [location.lat, location.lng, roomKey]);

	useEffect(() => {
		void load();
	}, [load]);

	useEffect(() => {
		return subscribeRealtime((event) => {
			if (
				event.type === "room:message:new" &&
				event.data.roomType === "live_lounge" &&
				event.data.roomKey === roomKey
			) {
				setMessages((prev) =>
					prev.some((item) => item.id === event.data.message.id)
						? prev
						: [...prev, event.data.message]
				);
			}
		});
	}, [roomKey]);

	const handleSend = async () => {
		if (!content.trim() || location.lat == null || location.lng == null)
			return;
		const { data } = await roomsApi.sendLiveLoungeMessage(roomKey, {
			content: content.trim(),
			mediaUrl: mediaUrl.trim() || null,
			lat: location.lat,
			lng: location.lng
		});
		setMessages((prev) =>
			prev.some((item) => item.id === data.id) ? prev : [...prev, data]
		);
		setContent("");
		setMediaUrl("");
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
			<Box style={{ padding: "16px", borderBottom: "1px solid #2a2a2a" }}>
				<Group justify="space-between">
					<Button
						variant="subtle"
						color="gray"
						onClick={() => navigate(-1)}
					>
						← Back
					</Button>
					<Text fw={800}>
						{currentLounge?.title ?? "Live Lounge"}
					</Text>
					<Text size="sm" c="dimmed">
						{currentLounge?.activeUsers ?? 0} live
					</Text>
				</Group>
				<Text size="sm" c="dimmed" mt={8}>
					Inside a 500m crowd radius, chat and drop photo URLs while
					the room is active.
				</Text>
			</Box>

			{error ? (
				<Stack
					align="center"
					justify="center"
					style={{ flex: 1 }}
					px={24}
				>
					<Text size="xl">📍</Text>
					<Text fw={700}>{error}</Text>
				</Stack>
			) : (
				<>
					<Box
						style={{ flex: 1, overflowY: "auto", padding: "16px" }}
					>
						<Stack gap="sm">
							{messages.map((item) => (
								<Paper
									key={item.id}
									radius="lg"
									style={{
										background: "#141414",
										border: "1px solid #2a2a2a",
										padding: 12
									}}
								>
									<Text
										fw={600}
										style={{
											color:
												item.author?.usernameColor ??
												"#f0f0f0"
										}}
									>
										{item.author?.displayName ??
											item.author?.username ??
											`User #${item.userId}`}
									</Text>
									<Text size="sm">{item.content}</Text>
									{item.mediaUrl && (
										<Text size="xs" c="dimmed" mt={6}>
											Photo: {item.mediaUrl}
										</Text>
									)}
								</Paper>
							))}
						</Stack>
					</Box>

					<Box
						style={{
							padding: "16px",
							borderTop: "1px solid #2a2a2a"
						}}
					>
						<Stack gap="xs">
							<TextInput
								placeholder="Optional photo URL"
								value={mediaUrl}
								onChange={(event) =>
									setMediaUrl(event.currentTarget.value)
								}
							/>
							<Group wrap="nowrap">
								<TextInput
									style={{ flex: 1 }}
									placeholder="Drop into the lounge"
									value={content}
									onChange={(event) =>
										setContent(event.currentTarget.value)
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
									onClick={() => void handleSend()}
								>
									↑
								</ActionIcon>
							</Group>
						</Stack>
					</Box>
				</>
			)}
		</Box>
	);
};

export default LiveLoungePage;

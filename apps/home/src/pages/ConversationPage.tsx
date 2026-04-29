import { useState, useEffect, useRef, useCallback } from "react";
import {
	Avatar,
	Box,
	Center,
	Group,
	Loader,
	Text,
	TextInput,
	ActionIcon
} from "@mantine/core";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { messagesApi, type Message } from "../api/messages.api";
import { subscribeRealtime } from "../realtime/realtime.client";

function timeAgo(dateStr: string): string {
	const diff = Date.now() - new Date(dateStr).getTime();
	const mins = Math.floor(diff / 60_000);
	if (mins < 1) return "just now";
	if (mins < 60) return `${mins}m ago`;
	const hrs = Math.floor(mins / 60);
	if (hrs < 24) return `${hrs}h ago`;
	return `${Math.floor(hrs / 24)}d ago`;
}

const ConversationPage = () => {
	const { conversationId } = useParams<{ conversationId: string }>();
	const { isAuthenticated, userId } = useAuthStore();
	const navigate = useNavigate();

	const [messages, setMessages] = useState<Message[]>([]);
	const [loading, setLoading] = useState(true);
	const [content, setContent] = useState("");
	const [sending, setSending] = useState(false);
	const [typingUserId, setTypingUserId] = useState<number | null>(null);
	const bottomRef = useRef<HTMLDivElement>(null);
	const typingClearRef = useRef<number | null>(null);
	const lastTypingSentAtRef = useRef(0);
	const convId = Number(conversationId);

	const loadMessages = useCallback(async () => {
		if (!convId) return;
		try {
			const { data } = await messagesApi.getMessages(convId);
			// Messages come newest-first, reverse for display
			setMessages([...data.data].reverse());
			await messagesApi.markRead(convId);
		} finally {
			setLoading(false);
		}
	}, [convId]);

	useEffect(() => {
		if (!isAuthenticated) return;
		void loadMessages();
	}, [isAuthenticated, loadMessages]);

	useEffect(() => {
		if (!isAuthenticated || !convId) return;

		return subscribeRealtime((event) => {
			if (
				event.type === "message:new" &&
				event.data.conversationId === convId
			) {
				setMessages((prev) => {
					if (
						prev.some(
							(message) => message.id === event.data.message.id
						)
					) {
						return prev;
					}
					return [...prev, event.data.message];
				});
				if (event.data.message.senderId !== userId) {
					void messagesApi.markRead(convId);
				}
				return;
			}

			if (
				event.type === "message:typing" &&
				event.data.conversationId === convId &&
				event.data.userId !== userId
			) {
				setTypingUserId(event.data.userId);
				if (typingClearRef.current !== null) {
					window.clearTimeout(typingClearRef.current);
				}
				const timeoutMs = Math.max(
					500,
					new Date(event.data.expiresAt).getTime() - Date.now()
				);
				typingClearRef.current = window.setTimeout(() => {
					setTypingUserId(null);
					typingClearRef.current = null;
				}, timeoutMs);
			}
		});
	}, [convId, isAuthenticated, userId]);

	useEffect(() => {
		return () => {
			if (typingClearRef.current !== null) {
				window.clearTimeout(typingClearRef.current);
			}
		};
	}, []);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const handleSend = async () => {
		const trimmed = content.trim();
		if (!trimmed || sending) return;
		setSending(true);
		try {
			const { data: msg } = await messagesApi.sendMessage(
				convId,
				trimmed
			);
			setMessages((prev) => {
				if (prev.some((message) => message.id === msg.id)) {
					return prev;
				}
				return [...prev, msg];
			});
			setContent("");
		} finally {
			setSending(false);
		}
	};

	const handleContentChange = (nextValue: string) => {
		setContent(nextValue);
		if (!convId || !nextValue.trim()) return;

		const now = Date.now();
		if (now - lastTypingSentAtRef.current < 1_500) return;

		lastTypingSentAtRef.current = now;
		void messagesApi.sendTyping(convId);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	if (!isAuthenticated) {
		return (
			<Center style={{ height: "100%" }} p={24}>
				<Text c="dimmed">Sign in to view messages</Text>
			</Center>
		);
	}

	return (
		<Box
			style={{
				height: "100%",
				background: "#0a0a0a",
				display: "flex",
				flexDirection: "column"
			}}
		>
			{/* Header */}
			<Box
				style={{
					padding: "12px 16px",
					borderBottom: "1px solid #2a2a2a",
					display: "flex",
					alignItems: "center",
					gap: 12
				}}
			>
				<ActionIcon
					variant="subtle"
					color="gray"
					onClick={() => navigate("/messages")}
					size="lg"
				>
					←
				</ActionIcon>
				<Text fw={600} style={{ color: "#fff" }}>
					Conversation
				</Text>
			</Box>

			{/* Messages */}
			<Box style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
				{loading ? (
					<Center py={40}>
						<Loader color="violet" />
					</Center>
				) : messages.length === 0 ? (
					<Center py={40}>
						<Text c="dimmed" size="sm">
							No messages yet. Say hello! 👋
						</Text>
					</Center>
				) : (
					messages.map((msg) => {
						const isOwn = msg.senderId === userId;
						return (
							<Box
								key={msg.id}
								style={{
									display: "flex",
									justifyContent: isOwn
										? "flex-end"
										: "flex-start",
									marginBottom: 10
								}}
							>
								{!isOwn && (
									<Avatar
										radius="xl"
										size="sm"
										color="violet"
										style={{
											background: "#2a2a2a",
											marginRight: 8,
											flexShrink: 0,
											alignSelf: "flex-end"
										}}
									>
										{msg.sender?.displayName?.[0]?.toUpperCase() ??
											msg.sender?.username?.[0]?.toUpperCase() ??
											"?"}
									</Avatar>
								)}
								<Box style={{ maxWidth: "72%" }}>
									<Box
										style={{
											background: isOwn
												? "linear-gradient(135deg, #6c63ff, #8b85ff)"
												: "#1e1e1e",
											borderRadius: isOwn
												? "16px 16px 4px 16px"
												: "16px 16px 16px 4px",
											padding: "10px 14px",
											border: isOwn
												? "none"
												: "1px solid #2a2a2a"
										}}
									>
										<Text
											size="sm"
											style={{
												color: "#fff",
												wordBreak: "break-word"
											}}
										>
											{msg.content}
										</Text>
									</Box>
									<Text
										size="xs"
										c="dimmed"
										style={{
											textAlign: isOwn ? "right" : "left",
											marginTop: 3
										}}
									>
										{timeAgo(msg.createdAt)}
									</Text>
								</Box>
							</Box>
						);
					})
				)}
				{typingUserId !== null && (
					<Text c="dimmed" size="xs" mt={8}>
						User is typing...
					</Text>
				)}
				<div ref={bottomRef} />
			</Box>

			{/* Input */}
			<Box
				style={{
					padding: "12px 16px",
					borderTop: "1px solid #2a2a2a",
					background: "rgba(10,10,10,0.98)"
				}}
			>
				<Group gap={8} wrap="nowrap">
					<TextInput
						style={{ flex: 1 }}
						placeholder="Type a message…"
						value={content}
						onChange={(e) =>
							handleContentChange(e.currentTarget.value)
						}
						onKeyDown={handleKeyDown}
						styles={{
							input: {
								background: "#1a1a1a",
								border: "1px solid #2a2a2a",
								color: "#fff",
								borderRadius: 20,
								paddingLeft: 16,
								paddingRight: 16,
								"&:focus": { borderColor: "#6c63ff" }
							}
						}}
					/>
					<ActionIcon
						size="lg"
						radius="xl"
						disabled={!content.trim() || sending}
						onClick={handleSend}
						style={{
							background: content.trim()
								? "linear-gradient(135deg, #6c63ff, #8b85ff)"
								: "#2a2a2a",
							color: "#fff",
							flexShrink: 0
						}}
					>
						{sending ? "…" : "↑"}
					</ActionIcon>
				</Group>
			</Box>
		</Box>
	);
};

export default ConversationPage;

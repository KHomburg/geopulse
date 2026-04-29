import { useState, useEffect, useRef, useCallback } from "react";
import {
	ActionIcon,
	Alert,
	Avatar,
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
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { messagesApi, type Message } from "../api/messages.api";
import { subscribeRealtime } from "../realtime/realtime.client";
import { getApiErrorMessage } from "../utils/apiErrors";
import {
	ChevronLeftIcon,
	MessagesIcon,
	ProfileIcon,
	SendIcon
} from "../components/icons";

function timeAgo(dateStr: string) {
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
	const { isAuthenticated, userId, accountNotice } = useAuthStore();
	const isWriteBlocked = accountNotice?.kind === "read_only";
	const navigate = useNavigate();

	const [messages, setMessages] = useState<Message[]>([]);
	const [loading, setLoading] = useState(true);
	const [content, setContent] = useState("");
	const [sending, setSending] = useState(false);
	const [sendError, setSendError] = useState<string | null>(null);
	const [typingUserId, setTypingUserId] = useState<number | null>(null);
	const bottomRef = useRef<HTMLDivElement>(null);
	const typingClearRef = useRef<number | null>(null);
	const lastTypingSentAtRef = useRef(0);
	const convId = Number(conversationId);

	const loadMessages = useCallback(async () => {
		if (!convId) return;
		try {
			const { data } = await messagesApi.getMessages(convId);
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
		if (!trimmed || sending || isWriteBlocked) return;
		setSending(true);
		try {
			const { data: message } = await messagesApi.sendMessage(
				convId,
				trimmed
			);
			setMessages((prev) => {
				if (prev.some((item) => item.id === message.id)) {
					return prev;
				}
				return [...prev, message];
			});
			setContent("");
			setSendError(null);
		} catch (error: unknown) {
			setSendError(getApiErrorMessage(error, "Failed to send message"));
		} finally {
			setSending(false);
		}
	};

	const handleContentChange = (nextValue: string) => {
		setContent(nextValue);
		if (!convId || !nextValue.trim() || isWriteBlocked) return;

		const now = Date.now();
		if (now - lastTypingSentAtRef.current < 1_500) return;

		lastTypingSentAtRef.current = now;
		void messagesApi.sendTyping(convId);
	};

	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			handleSend();
		}
	};

	if (!isAuthenticated) {
		return (
			<Box className="gp-page">
				<Center className="gp-scroll">
					<Stack className="gp-empty-state" align="center" gap="md">
						<Box className="gp-brand-mark">
							<MessagesIcon size={22} />
						</Box>
						<Stack gap={4} align="center">
							<Text fw={700} size="lg">
								Sign in to view messages
							</Text>
							<Text size="sm" c="dimmed" ta="center">
								Enter GeoPulse to continue your conversations
								and start new ones.
							</Text>
						</Stack>
						<Button onClick={() => navigate("/login")}>
							Enter GeoPulse
						</Button>
					</Stack>
				</Center>
			</Box>
		);
	}

	return (
		<Box
			className="gp-page"
			style={{ display: "flex", flexDirection: "column", minHeight: 0 }}
		>
			<Box className="gp-page-header" style={{ paddingBottom: 12 }}>
				<Group gap={12} wrap="nowrap" align="flex-start">
					<ActionIcon
						variant="subtle"
						size="lg"
						onClick={() => navigate("/messages")}
						style={{
							background: "rgba(255,255,255,0.05)",
							color: "#fffaf2",
							flexShrink: 0
						}}
					>
						<ChevronLeftIcon size={18} />
					</ActionIcon>
					<Box>
						<Text className="gp-page-header__eyebrow">
							Private line
						</Text>
						<Text className="gp-page-header__title">
							Conversation
						</Text>
						<Text className="gp-page-header__subtitle">
							A cleaner message stream with calmer spacing and
							clearer send states.
						</Text>
					</Box>
				</Group>
			</Box>

			<Box
				style={{
					flex: 1,
					minHeight: 0,
					overflowY: "auto",
					padding: "16px 20px 12px"
				}}
			>
				{loading ? (
					<Center py={56}>
						<Loader color="brand" />
					</Center>
				) : messages.length === 0 ? (
					<Center py={56}>
						<Stack
							className="gp-empty-state"
							align="center"
							gap="md"
						>
							<Box className="gp-brand-mark">
								<MessagesIcon size={22} />
							</Box>
							<Stack gap={4} align="center">
								<Text fw={700}>No messages yet</Text>
								<Text size="sm" c="dimmed" ta="center">
									Open the conversation with a first message
									when you are ready.
								</Text>
							</Stack>
						</Stack>
					</Center>
				) : (
					<Stack gap="sm">
						{messages.map((message) => {
							const isOwn = message.senderId === userId;
							const senderInitial =
								message.sender?.displayName?.[0]?.toUpperCase() ??
								message.sender?.username?.[0]?.toUpperCase() ??
								"?";

							return (
								<Group
									key={message.id}
									justify={isOwn ? "flex-end" : "flex-start"}
									align="flex-end"
									wrap="nowrap"
								>
									{!isOwn && (
										<Avatar
											radius="xl"
											size={34}
											style={{
												background:
													"rgba(255,255,255,0.05)",
												color: "#fffaf2",
												flexShrink: 0
											}}
										>
											{senderInitial === "?" ? (
												<ProfileIcon size={15} />
											) : (
												senderInitial
											)}
										</Avatar>
									)}
									<Box style={{ maxWidth: "78%" }}>
										<Box
											style={{
												padding: "12px 16px",
												borderRadius: isOwn
													? "24px 24px 10px 24px"
													: "24px 24px 24px 10px",
												background: isOwn
													? "linear-gradient(135deg, #c4874d, #d9a066)"
													: "rgba(20, 20, 24, 0.92)",
												border: isOwn
													? "none"
													: "1px solid rgba(255,255,255,0.08)",
												boxShadow: isOwn
													? "0 16px 28px rgba(196,135,77,0.24)"
													: "none"
											}}
										>
											<Text
												size="sm"
												style={{
													color: isOwn
														? "#161616"
														: "#fffaf2",
													wordBreak: "break-word"
												}}
											>
												{message.content}
											</Text>
										</Box>
										<Text
											size="xs"
											c="dimmed"
											mt={6}
											ta={isOwn ? "right" : "left"}
										>
											{timeAgo(message.createdAt)}
										</Text>
									</Box>
								</Group>
							);
						})}
						{typingUserId !== null && (
							<Box className="gp-mini-pill" w="fit-content">
								<Text size="xs" c="inherit">
									Someone is typing...
								</Text>
							</Box>
						)}
					</Stack>
				)}
				<div ref={bottomRef} />
			</Box>

			<Box style={{ padding: "0 20px 20px" }}>
				<Paper className="gp-surface gp-surface--strong" p="md">
					<Stack gap="sm">
						{accountNotice?.kind === "read_only" && (
							<Alert color="yellow" variant="light">
								{accountNotice.message}
							</Alert>
						)}
						{sendError && (
							<Alert color="red" variant="light">
								{sendError}
							</Alert>
						)}
						<Group gap={10} wrap="nowrap" align="flex-end">
							<TextInput
								style={{ flex: 1 }}
								placeholder={
									isWriteBlocked
										? "Messaging is disabled while your account is read-only"
										: "Type a message"
								}
								value={content}
								disabled={isWriteBlocked}
								onChange={(event) =>
									handleContentChange(
										event.currentTarget.value
									)
								}
								onKeyDown={handleKeyDown}
							/>
							<ActionIcon
								size={44}
								radius="xl"
								disabled={
									isWriteBlocked || !content.trim() || sending
								}
								onClick={handleSend}
								style={{
									background:
										content.trim() && !isWriteBlocked
											? "linear-gradient(135deg, #c4874d, #d9a066)"
											: "rgba(255,255,255,0.06)",
									color:
										content.trim() && !isWriteBlocked
											? "#161616"
											: "rgba(255,250,242,0.55)",
									flexShrink: 0
								}}
							>
								{sending ? (
									<Loader size={16} color="currentColor" />
								) : (
									<SendIcon size={18} />
								)}
							</ActionIcon>
						</Group>
					</Stack>
				</Paper>
			</Box>
		</Box>
	);
};

export default ConversationPage;

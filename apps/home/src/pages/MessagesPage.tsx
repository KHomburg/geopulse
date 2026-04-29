import { useState, useEffect, useCallback } from "react";
import {
	Avatar,
	Box,
	Button,
	Center,
	Group,
	Loader,
	Stack,
	Text
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { messagesApi, type Conversation } from "../api/messages.api";
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

function getOtherParticipant(conv: Conversation, myId: number) {
	const participants = conv.allParticipants ?? conv.participants ?? [];
	return participants.find((p) => p.userId !== myId);
}

function participantLabel(conv: Conversation, myId: number): string {
	const other = getOtherParticipant(conv, myId);
	if (!other?.user) return "Conversation";
	const u = other.user;
	return u.displayName ?? u.username ?? `User #${u.id}`;
}

function participantInitials(conv: Conversation, myId: number): string {
	return participantLabel(conv, myId)[0]?.toUpperCase() ?? "?";
}

const MessagesPage = () => {
	const { isAuthenticated, userId } = useAuthStore();
	const navigate = useNavigate();

	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [loading, setLoading] = useState(true);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const { data } = await messagesApi.getConversations();
			setConversations(data.data);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (!isAuthenticated) return;
		void load();
	}, [isAuthenticated, load]);

	useEffect(() => {
		if (!isAuthenticated) return;
		return subscribeRealtime((event) => {
			if (event.type === "message:new") {
				void load();
			}
		});
	}, [isAuthenticated, load]);

	if (!isAuthenticated) {
		return (
			<Center style={{ height: "100%" }} p={24}>
				<Stack align="center" gap="md">
					<Text size="xl">💬</Text>
					<Text fw={700} size="lg">
						Sign in to see messages
					</Text>
					<Button
						onClick={() => navigate("/login")}
						style={{
							background:
								"linear-gradient(135deg, #6c63ff 0%, #8b85ff 100%)",
							height: 48
						}}
					>
						Sign In
					</Button>
				</Stack>
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
			<Box style={{ padding: "20px 16px 12px" }}>
				<Text fw={700} size="xl" style={{ color: "#fff" }}>
					Messages
				</Text>
			</Box>

			<Box style={{ flex: 1, overflowY: "auto" }}>
				{loading ? (
					<Center py={40}>
						<Loader color="violet" />
					</Center>
				) : conversations.length === 0 ? (
					<Center py={60}>
						<Stack align="center" gap="xs">
							<Text size="2xl">💬</Text>
							<Text fw={600} c="dimmed">
								No messages yet
							</Text>
							<Text size="sm" c="dimmed" ta="center">
								Go to Contacts to start a conversation
							</Text>
							<Button
								variant="outline"
								color="violet"
								mt={8}
								onClick={() => navigate("/contacts")}
							>
								View Contacts
							</Button>
						</Stack>
					</Center>
				) : (
					<Stack gap={0}>
						{conversations.map((conv) => {
							const lastMsg = conv.lastMessage?.[0] ?? null;
							const label = participantLabel(conv, userId!);
							const initials = participantInitials(conv, userId!);

							return (
								<Box
									key={conv.id}
									onClick={() =>
										navigate(`/messages/${conv.id}`)
									}
									style={{
										padding: "14px 16px",
										borderBottom: "1px solid #1a1a1a",
										cursor: "pointer",
										transition: "background 0.15s"
									}}
									onMouseEnter={(e) =>
										((
											e.currentTarget as HTMLElement
										).style.background = "#141414")
									}
									onMouseLeave={(e) =>
										((
											e.currentTarget as HTMLElement
										).style.background = "transparent")
									}
								>
									<Group gap={12} wrap="nowrap">
										<Avatar
											radius="xl"
											size="md"
											color="violet"
											style={{
												background: "#2a2a2a",
												flexShrink: 0
											}}
										>
											{initials}
										</Avatar>
										<Box style={{ flex: 1, minWidth: 0 }}>
											<Group
												justify="space-between"
												wrap="nowrap"
												mb={2}
											>
												<Text
													size="sm"
													fw={600}
													style={{
														overflow: "hidden",
														textOverflow:
															"ellipsis",
														whiteSpace: "nowrap"
													}}
												>
													{label}
												</Text>
												{lastMsg && (
													<Text
														size="xs"
														c="dimmed"
														style={{
															flexShrink: 0
														}}
													>
														{timeAgo(
															lastMsg.createdAt
														)}
													</Text>
												)}
											</Group>
											<Text
												size="xs"
												c="dimmed"
												style={{
													overflow: "hidden",
													textOverflow: "ellipsis",
													whiteSpace: "nowrap"
												}}
											>
												{lastMsg
													? lastMsg.content
													: "No messages yet"}
											</Text>
										</Box>
									</Group>
								</Box>
							);
						})}
					</Stack>
				)}
			</Box>
		</Box>
	);
};

export default MessagesPage;

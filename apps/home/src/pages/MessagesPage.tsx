import { useState, useEffect, useCallback } from "react";
import {
	Avatar,
	Box,
	Button,
	Center,
	Group,
	Loader,
	Paper,
	Stack,
	Text
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { messagesApi, type Conversation } from "../api/messages.api";
import { subscribeRealtime } from "../realtime/realtime.client";
import {
	ChevronRightIcon,
	MessagesIcon,
	ProfileIcon
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

function getOtherParticipant(conv: Conversation, myId: number) {
	const participants = conv.allParticipants ?? conv.participants ?? [];
	return participants.find((participant) => participant.userId !== myId);
}

function participantLabel(conv: Conversation, myId: number) {
	const other = getOtherParticipant(conv, myId);
	if (!other?.user) return "Conversation";
	const user = other.user;
	return user.displayName ?? user.username ?? `User #${user.id}`;
}

function participantInitials(conv: Conversation, myId: number) {
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
			<Box className="gp-page">
				<Center className="gp-scroll">
					<Stack className="gp-empty-state" align="center" gap="md">
						<Box className="gp-brand-mark">
							<MessagesIcon size={22} />
						</Box>
						<Stack
							gap={4}
							align="center"
							className="gp-empty-state__copy"
						>
							<Text fw={700} size="lg">
								Sign in to see messages
							</Text>
							<Text size="sm" c="dimmed" ta="center">
								Unlock direct lines for event planning, local
								replies, and one-to-one followups without losing
								the thread.
							</Text>
						</Stack>
						<Box className="gp-empty-state__actions">
							<Button onClick={() => navigate("/login")}>
								Sign in to unlock direct lines
							</Button>
							<Button
								variant="light"
								color="brand"
								onClick={() => navigate("/register")}
							>
								Create account
							</Button>
						</Box>
					</Stack>
				</Center>
			</Box>
		);
	}

	return (
		<Box className="gp-page">
			<Box className="gp-page-header">
				<Text className="gp-page-header__eyebrow">Direct lines</Text>
				<Text className="gp-page-header__title">Messages</Text>
				<Text className="gp-page-header__subtitle">
					Private conversations arranged like a polished inbox instead
					of a raw activity dump.
				</Text>
			</Box>

			<Box className="gp-scroll" style={{ paddingTop: 16 }}>
				{loading ? (
					<Center py={56}>
						<Loader color="brand" />
					</Center>
				) : conversations.length === 0 ? (
					<Center py={56}>
						<Stack
							className="gp-empty-state"
							align="center"
							gap="md"
						>
							<Box className="gp-brand-mark">
								<MessagesIcon size={22} />
							</Box>
							<Stack
								gap={4}
								align="center"
								className="gp-empty-state__copy"
							>
								<Text fw={700}>No messages yet</Text>
								<Text size="sm" c="dimmed" ta="center">
									Start with a contact request, then bring
									quick plans or local followups into a
									private thread.
								</Text>
							</Stack>
							<Box className="gp-empty-state__actions">
								<Button onClick={() => navigate("/contacts")}>
									View contacts
								</Button>
								<Button
									variant="light"
									color="brand"
									onClick={() => navigate("/feed")}
								>
									Browse feed
								</Button>
							</Box>
						</Stack>
					</Center>
				) : (
					<Stack gap="sm">
						{conversations.map((conversation) => {
							const lastMessage =
								conversation.lastMessage?.[0] ?? null;
							const label = participantLabel(
								conversation,
								userId!
							);
							const initials = participantInitials(
								conversation,
								userId!
							);
							const preview = lastMessage
								? `${
										lastMessage.senderId === userId
											? "You: "
											: ""
								  }${lastMessage.content}`
								: "No messages yet";

							return (
								<Paper
									component="button"
									type="button"
									key={conversation.id}
									className="gp-surface"
									p="lg"
									onClick={() =>
										navigate(`/messages/${conversation.id}`)
									}
									style={{
										textAlign: "left",
										width: "100%",
										cursor: "pointer"
									}}
								>
									<Group
										justify="space-between"
										wrap="nowrap"
										align="flex-start"
									>
										<Group
											gap={12}
											wrap="nowrap"
											align="flex-start"
											style={{ flex: 1, minWidth: 0 }}
										>
											<Avatar
												radius="xl"
												size={46}
												style={{
													background:
														"rgba(255,255,255,0.05)",
													color: "#fffaf2",
													flexShrink: 0
												}}
											>
												{initials === "?" ? (
													<ProfileIcon size={18} />
												) : (
													initials
												)}
											</Avatar>
											<Box
												style={{ flex: 1, minWidth: 0 }}
											>
												<Group
													justify="space-between"
													wrap="nowrap"
													gap={12}
												>
													<Text fw={700} truncate>
														{label}
													</Text>
													{lastMessage && (
														<Text
															size="xs"
															c="dimmed"
															style={{
																flexShrink: 0
															}}
														>
															{timeAgo(
																lastMessage.createdAt
															)}
														</Text>
													)}
												</Group>
												<Text
													size="sm"
													c="dimmed"
													truncate
													mt={4}
												>
													{preview}
												</Text>
											</Box>
										</Group>
										<ChevronRightIcon
											size={18}
											style={{
												color: "rgba(255,250,242,0.58)",
												flexShrink: 0
											}}
										/>
									</Group>
								</Paper>
							);
						})}
					</Stack>
				)}
			</Box>
		</Box>
	);
};

export default MessagesPage;

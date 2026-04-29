import { useState, useEffect, useRef, type ReactNode } from "react";
import {
	Alert,
	Avatar,
	Badge,
	Box,
	Button,
	Center,
	Group,
	Loader,
	Paper,
	Stack,
	Tabs,
	Text,
	TextInput
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import {
	contactsApi,
	type Contact,
	type ContactUser
} from "../api/contacts.api";
import apiClient from "../api/client";
import { getApiErrorMessage } from "../utils/apiErrors";
import {
	MessagesIcon,
	ProfileIcon,
	SearchIcon,
	ShieldIcon
} from "../components/icons";

function getOtherUser(contact: Contact, myId: number) {
	if (contact.requesterId === myId) return contact.addressee;
	return contact.requester;
}

function userLabel(user: ContactUser | undefined) {
	if (!user) return "Unknown";
	return user.displayName ?? user.username ?? `User #${user.id}`;
}

function userInitials(user: ContactUser | undefined) {
	const label = userLabel(user);
	return label[0]?.toUpperCase() ?? "?";
}

const ContactsPage = () => {
	const { isAuthenticated, userId, accountNotice } = useAuthStore();
	const isWriteBlocked = accountNotice?.kind === "read_only";
	const navigate = useNavigate();

	const [friends, setFriends] = useState<Contact[]>([]);
	const [requests, setRequests] = useState<Contact[]>([]);
	const [sent, setSent] = useState<Contact[]>([]);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<string | null>("friends");
	const [actionError, setActionError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<ContactUser[]>([]);
	const [searching, setSearching] = useState(false);
	const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const load = async () => {
		setLoading(true);
		try {
			const [friendsResponse, requestsResponse, sentResponse] =
				await Promise.all([
					contactsApi.getFriends(),
					contactsApi.getPendingRequests(),
					contactsApi.getSentRequests()
				]);
			setFriends(friendsResponse.data.data);
			setRequests(requestsResponse.data.data);
			setSent(sentResponse.data.data);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (!isAuthenticated) return;
		void load();
	}, [isAuthenticated]);

	useEffect(() => {
		return () => {
			if (searchTimer.current) {
				clearTimeout(searchTimer.current);
			}
		};
	}, []);

	const handleAccept = async (contactId: number) => {
		if (isWriteBlocked) return;

		try {
			await contactsApi.acceptRequest(contactId);
			setActionError(null);
			await load();
		} catch (error: unknown) {
			setActionError(
				getApiErrorMessage(error, "Failed to accept request")
			);
		}
	};

	const handleDecline = async (contactId: number) => {
		if (isWriteBlocked) return;

		try {
			await contactsApi.declineOrRemove(contactId);
			setActionError(null);
			await load();
		} catch (error: unknown) {
			setActionError(
				getApiErrorMessage(error, "Failed to update contact")
			);
		}
	};

	const handleSearch = (query: string) => {
		setSearchQuery(query);
		if (searchTimer.current) {
			clearTimeout(searchTimer.current);
		}

		if (query.length < 2) {
			setSearchResults([]);
			return;
		}

		searchTimer.current = setTimeout(async () => {
			setSearching(true);
			try {
				const { data } = await apiClient.get<{ data: ContactUser[] }>(
					`/user/search?q=${encodeURIComponent(query)}`
				);
				setSearchResults(
					data.data.filter((user) => user.id !== userId)
				);
			} catch {
				setSearchResults([]);
			} finally {
				setSearching(false);
			}
		}, 400);
	};

	const handleSendRequest = async (targetUserId: number) => {
		if (isWriteBlocked) return;

		try {
			await contactsApi.sendRequest(targetUserId);
			setActionError(null);
			const { data } = await contactsApi.getSentRequests();
			setSent(data.data);
		} catch (error: unknown) {
			setActionError(getApiErrorMessage(error, "Failed to send request"));
		}
	};

	const renderEmptyTab = (
		title: string,
		description: string,
		icon: ReactNode
	) => (
		<Center py={48}>
			<Stack className="gp-empty-state" align="center" gap="md">
				<Box className="gp-brand-mark">{icon}</Box>
				<Stack gap={4} align="center">
					<Text fw={700}>{title}</Text>
					<Text size="sm" c="dimmed" ta="center">
						{description}
					</Text>
				</Stack>
			</Stack>
		</Center>
	);

	const renderPersonCard = (
		user: ContactUser | undefined,
		actions: ReactNode,
		meta?: ReactNode
	) => (
		<Paper className="gp-surface" p="lg" key={user?.id ?? userLabel(user)}>
			<Group justify="space-between" align="flex-start" wrap="nowrap">
				<Group
					gap={12}
					align="flex-start"
					wrap="nowrap"
					style={{ flex: 1, minWidth: 0 }}
				>
					<Avatar
						radius="xl"
						size={46}
						style={{
							background: "rgba(255,255,255,0.05)",
							color: "#fffaf2",
							flexShrink: 0
						}}
					>
						{userInitials(user) === "?" ? (
							<ProfileIcon size={18} />
						) : (
							userInitials(user)
						)}
					</Avatar>
					<Box style={{ minWidth: 0 }}>
						<Text fw={700} truncate>
							{userLabel(user)}
						</Text>
						{user?.username && (
							<Text size="sm" c="dimmed" mt={4}>
								@{user.username}
							</Text>
						)}
						{meta}
					</Box>
				</Group>
				<Group gap={8} wrap="wrap" justify="flex-end">
					{actions}
				</Group>
			</Group>
		</Paper>
	);

	if (!isAuthenticated) {
		return (
			<Box className="gp-page">
				<Center className="gp-scroll">
					<Stack className="gp-empty-state" align="center" gap="md">
						<Box className="gp-brand-mark">
							<ProfileIcon size={22} />
						</Box>
						<Stack gap={4} align="center">
							<Text fw={700} size="lg">
								Sign in to see contacts
							</Text>
							<Text size="sm" c="dimmed" ta="center">
								Search nearby people, approve requests, and keep
								your direct lines organized.
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
		<Box className="gp-page">
			<Box className="gp-page-header">
				<Text className="gp-page-header__eyebrow">Inner circle</Text>
				<Text className="gp-page-header__title">Contacts</Text>
				<Text className="gp-page-header__subtitle">
					People search, friend requests, and message launch points
					brought into the same polished system.
				</Text>
			</Box>

			<Box className="gp-scroll" style={{ paddingTop: 16 }}>
				<Stack gap="lg">
					<Paper className="gp-surface gp-surface--strong" p="lg">
						<Stack gap="sm">
							{accountNotice?.kind === "read_only" && (
								<Alert color="yellow" variant="light">
									{accountNotice.message}
								</Alert>
							)}
							{actionError && (
								<Alert color="red" variant="light">
									{actionError}
								</Alert>
							)}
							<Box>
								<Text
									className="gp-page-header__eyebrow"
									style={{ marginBottom: 8 }}
								>
									Find people
								</Text>
								<TextInput
									placeholder="Search by display name or username"
									value={searchQuery}
									onChange={(event) =>
										handleSearch(event.currentTarget.value)
									}
									leftSection={<SearchIcon size={16} />}
								/>
							</Box>

							{searchQuery.length >= 2 && (
								<Stack gap="sm">
									{searching ? (
										<Center py={28}>
											<Loader size="sm" color="brand" />
										</Center>
									) : searchResults.length === 0 ? (
										renderEmptyTab(
											"No users found",
											"Try another name or username. People appear here as you type.",
											<SearchIcon size={20} />
										)
									) : (
										searchResults.map((user) => {
											const alreadyFriend = friends.some(
												(contact) =>
													contact.requesterId ===
														user.id ||
													contact.addresseeId ===
														user.id
											);
											const alreadySent = sent.some(
												(contact) =>
													contact.addresseeId ===
													user.id
											);

											return renderPersonCard(
												user,
												alreadyFriend ? (
													<Badge
														color="teal"
														variant="light"
													>
														Friends
													</Badge>
												) : alreadySent ? (
													<Badge
														color="yellow"
														variant="light"
													>
														Pending
													</Badge>
												) : (
													<Button
														size="xs"
														color="brand"
														disabled={
															isWriteBlocked
														}
														onClick={() =>
															handleSendRequest(
																user.id
															)
														}
													>
														Add
													</Button>
												)
											);
										})
									)}
								</Stack>
							)}
						</Stack>
					</Paper>

					<Paper className="gp-surface" p="md">
						<Tabs
							value={activeTab}
							onChange={setActiveTab}
							styles={{
								list: {
									background: "rgba(255,255,255,0.04)",
									borderRadius: 999,
									padding: 4,
									borderBottom: "none",
									width: "fit-content"
								},
								tab: {
									borderRadius: 999,
									fontWeight: 700,
									color: "#b8b7c9",
									minHeight: 40,
									"&[dataActive]": {
										background:
											"linear-gradient(135deg, #c4874d, #d9a066)",
										color: "#161616"
									}
								}
							}}
						>
							<Tabs.List>
								<Tabs.Tab value="friends">
									Friends{" "}
									{friends.length > 0
										? `(${friends.length})`
										: ""}
								</Tabs.Tab>
								<Tabs.Tab value="requests">
									Requests{" "}
									{requests.length > 0
										? `(${requests.length})`
										: ""}
								</Tabs.Tab>
								<Tabs.Tab value="sent">
									Sent{" "}
									{sent.length > 0 ? `(${sent.length})` : ""}
								</Tabs.Tab>
							</Tabs.List>

							<Box pt="lg">
								{loading ? (
									<Center py={48}>
										<Loader color="brand" />
									</Center>
								) : (
									<>
										<Tabs.Panel value="friends">
											{friends.length === 0 ? (
												renderEmptyTab(
													"No friends yet",
													"Search for people above and start building your trusted local circle.",
													<ShieldIcon size={20} />
												)
											) : (
												<Stack gap="sm">
													{friends.map((contact) => {
														const other =
															getOtherUser(
																contact,
																userId!
															);
														return renderPersonCard(
															other,
															<>
																<Button
																	size="xs"
																	variant="subtle"
																	color="brand"
																	onClick={() =>
																		navigate(
																			"/messages"
																		)
																	}
																>
																	Messages
																</Button>
																<Button
																	size="xs"
																	variant="subtle"
																	color="red"
																	disabled={
																		isWriteBlocked
																	}
																	onClick={() =>
																		handleDecline(
																			contact.id
																		)
																	}
																>
																	Remove
																</Button>
															</>,
															<Box
																className="gp-mini-pill"
																w="fit-content"
																mt={10}
															>
																<MessagesIcon
																	size={14}
																/>
																<Text
																	size="xs"
																	c="inherit"
																>
																	Connected
																	and ready
																	for direct
																	messages
																</Text>
															</Box>
														);
													})}
												</Stack>
											)}
										</Tabs.Panel>

										<Tabs.Panel value="requests">
											{requests.length === 0 ? (
												renderEmptyTab(
													"No pending requests",
													"New friend requests appear here when someone wants to connect.",
													<ProfileIcon size={20} />
												)
											) : (
												<Stack gap="sm">
													{requests.map((contact) =>
														renderPersonCard(
															contact.requester,
															<>
																<Button
																	size="xs"
																	color="brand"
																	disabled={
																		isWriteBlocked
																	}
																	onClick={() =>
																		handleAccept(
																			contact.id
																		)
																	}
																>
																	Accept
																</Button>
																<Button
																	size="xs"
																	variant="subtle"
																	color="gray"
																	disabled={
																		isWriteBlocked
																	}
																	onClick={() =>
																		handleDecline(
																			contact.id
																		)
																	}
																>
																	Decline
																</Button>
															</>,
															<Box
																className="gp-mini-pill"
																w="fit-content"
																mt={10}
															>
																<ShieldIcon
																	size={14}
																/>
																<Text
																	size="xs"
																	c="inherit"
																>
																	Request
																	waiting for
																	your
																	approval
																</Text>
															</Box>
														)
													)}
												</Stack>
											)}
										</Tabs.Panel>

										<Tabs.Panel value="sent">
											{sent.length === 0 ? (
												renderEmptyTab(
													"No sent requests",
													"Outgoing invitations stay here until the other person responds.",
													<SearchIcon size={20} />
												)
											) : (
												<Stack gap="sm">
													{sent.map((contact) =>
														renderPersonCard(
															contact.addressee,
															<Badge
																color="yellow"
																variant="light"
															>
																Pending
															</Badge>
														)
													)}
												</Stack>
											)}
										</Tabs.Panel>
									</>
								)}
							</Box>
						</Tabs>
					</Paper>
				</Stack>
			</Box>
		</Box>
	);
};

export default ContactsPage;

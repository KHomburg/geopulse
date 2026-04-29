import { useState, useEffect, useRef } from "react";
import {
	Avatar,
	Badge,
	Box,
	Button,
	Center,
	Group,
	Loader,
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

function getOtherUser(contact: Contact, myId: number): ContactUser | undefined {
	if (contact.requesterId === myId) return contact.addressee;
	return contact.requester;
}

function userLabel(user: ContactUser | undefined): string {
	if (!user) return "Unknown";
	return user.displayName ?? user.username ?? `User #${user.id}`;
}

function userInitials(user: ContactUser | undefined): string {
	const label = userLabel(user);
	return label[0]?.toUpperCase() ?? "?";
}

const ContactsPage = () => {
	const { isAuthenticated, userId } = useAuthStore();
	const navigate = useNavigate();

	const [friends, setFriends] = useState<Contact[]>([]);
	const [requests, setRequests] = useState<Contact[]>([]);
	const [sent, setSent] = useState<Contact[]>([]);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<string | null>("friends");

	// Search state
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<ContactUser[]>([]);
	const [searching, setSearching] = useState(false);
	const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const load = async () => {
		setLoading(true);
		try {
			const [fr, rq, st] = await Promise.all([
				contactsApi.getFriends(),
				contactsApi.getPendingRequests(),
				contactsApi.getSentRequests()
			]);
			setFriends(fr.data.data);
			setRequests(rq.data.data);
			setSent(st.data.data);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (isAuthenticated) load();
	}, [isAuthenticated]);

	const handleAccept = async (contactId: number) => {
		await contactsApi.acceptRequest(contactId);
		await load();
	};

	const handleDecline = async (contactId: number) => {
		await contactsApi.declineOrRemove(contactId);
		await load();
	};

	const handleSearch = (q: string) => {
		setSearchQuery(q);
		if (searchTimer.current) clearTimeout(searchTimer.current);
		if (q.length < 2) {
			setSearchResults([]);
			return;
		}
		searchTimer.current = setTimeout(async () => {
			setSearching(true);
			try {
				const { data } = await apiClient.get<{ data: ContactUser[] }>(
					`/user/search?q=${encodeURIComponent(q)}`
				);
				// Filter out self
				setSearchResults(data.data.filter((u) => u.id !== userId));
			} catch {
				setSearchResults([]);
			} finally {
				setSearching(false);
			}
		}, 400);
	};

	const handleSendRequest = async (targetUserId: number) => {
		await contactsApi.sendRequest(targetUserId);
		// Refresh sent list
		const { data } = await contactsApi.getSentRequests();
		setSent(data.data);
	};

	if (!isAuthenticated) {
		return (
			<Center style={{ height: "100%" }} p={24}>
				<Stack align="center" gap="md">
					<Text size="xl">👥</Text>
					<Text fw={700} size="lg">
						Sign in to see contacts
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
			<Box style={{ padding: "20px 16px 8px" }}>
				<Text fw={700} size="xl" style={{ color: "#fff" }}>
					Contacts
				</Text>
			</Box>

			<Box px={16} pb={8}>
				<TextInput
					placeholder="Search people…"
					value={searchQuery}
					onChange={(e) => handleSearch(e.currentTarget.value)}
					leftSection="🔍"
					styles={{
						input: {
							background: "#141414",
							border: "1px solid #2a2a2a",
							color: "#f0f0f0"
						}
					}}
				/>
				{searchQuery.length >= 2 && (
					<Box mt={8}>
						{searching ? (
							<Center py={20}>
								<Loader size="xs" color="violet" />
							</Center>
						) : searchResults.length === 0 ? (
							<Text size="sm" c="dimmed" ta="center" py={12}>
								No users found
							</Text>
						) : (
							<Stack gap={6}>
								{searchResults.map((u) => {
									const alreadyFriend = friends.some(
										(f) =>
											f.requesterId === u.id ||
											f.addresseeId === u.id
									);
									const alreadySent = sent.some(
										(s) => s.addresseeId === u.id
									);
									return (
										<Box
											key={u.id}
											style={{
												background: "#141414",
												border: "1px solid #2a2a2a",
												borderRadius: 10,
												padding: "10px 12px"
											}}
										>
											<Group
												justify="space-between"
												wrap="nowrap"
											>
												<Group gap={10} wrap="nowrap">
													<Avatar
														radius="xl"
														size="sm"
														color="violet"
														style={{
															background:
																"#2a2a2a"
														}}
													>
														{(u.displayName ??
															u.username)?.[0]?.toUpperCase() ??
															"?"}
													</Avatar>
													<Stack gap={0}>
														<Text
															size="sm"
															fw={600}
														>
															{u.displayName ??
																u.username}
														</Text>
														{u.username && (
															<Text
																size="xs"
																c="dimmed"
															>
																@{u.username}
															</Text>
														)}
													</Stack>
												</Group>
												{alreadyFriend ? (
													<Badge
														color="green"
														variant="outline"
														size="sm"
													>
														Friends
													</Badge>
												) : alreadySent ? (
													<Badge
														color="yellow"
														variant="outline"
														size="sm"
													>
														Pending
													</Badge>
												) : (
													<Button
														size="xs"
														color="violet"
														variant="filled"
														onClick={() =>
															handleSendRequest(
																u.id
															)
														}
													>
														Add
													</Button>
												)}
											</Group>
										</Box>
									);
								})}
							</Stack>
						)}
					</Box>
				)}
			</Box>

			<Tabs
				value={activeTab}
				onChange={setActiveTab}
				styles={{
					tab: {
						color: "#888",
						"&[dataActive]": { color: "#8b85ff" }
					},
					list: { borderBottom: "1px solid #2a2a2a" }
				}}
			>
				<Tabs.List px={16}>
					<Tabs.Tab value="friends">
						Friends {friends.length > 0 && `(${friends.length})`}
					</Tabs.Tab>
					<Tabs.Tab value="requests">
						Requests{" "}
						{requests.length > 0 && (
							<Badge size="xs" color="violet" ml={4}>
								{requests.length}
							</Badge>
						)}
					</Tabs.Tab>
					<Tabs.Tab value="sent">
						Sent {sent.length > 0 && `(${sent.length})`}
					</Tabs.Tab>
				</Tabs.List>

				<Box
					style={{ overflowY: "auto", flex: 1, padding: "12px 16px" }}
				>
					{loading ? (
						<Center py={40}>
							<Loader color="violet" />
						</Center>
					) : (
						<>
							<Tabs.Panel value="friends">
								{friends.length === 0 ? (
									<Center py={40}>
										<Stack align="center" gap="xs">
											<Text size="2xl">👥</Text>
											<Text c="dimmed" size="sm">
												No friends yet
											</Text>
										</Stack>
									</Center>
								) : (
									<Stack gap={8}>
										{friends.map((contact) => {
											const other = getOtherUser(
												contact,
												userId!
											);
											return (
												<Box
													key={contact.id}
													style={{
														background: "#141414",
														border: "1px solid #2a2a2a",
														borderRadius: 12,
														padding: "12px 14px"
													}}
												>
													<Group
														justify="space-between"
														wrap="nowrap"
													>
														<Group
															gap={10}
															wrap="nowrap"
														>
															<Avatar
																radius="xl"
																size="md"
																color="violet"
																style={{
																	background:
																		"#2a2a2a"
																}}
															>
																{userInitials(
																	other
																)}
															</Avatar>
															<Stack gap={0}>
																<Text
																	size="sm"
																	fw={600}
																>
																	{userLabel(
																		other
																	)}
																</Text>
																{other?.username && (
																	<Text
																		size="xs"
																		c="dimmed"
																	>
																		@
																		{
																			other.username
																		}
																	</Text>
																)}
															</Stack>
														</Group>
														<Group gap={6}>
															<Button
																size="xs"
																variant="outline"
																color="violet"
																onClick={() =>
																	other &&
																	navigate(
																		`/messages`
																	)
																}
															>
																Message
															</Button>
															<Button
																size="xs"
																variant="subtle"
																color="red"
																onClick={() =>
																	handleDecline(
																		contact.id
																	)
																}
															>
																Remove
															</Button>
														</Group>
													</Group>
												</Box>
											);
										})}
									</Stack>
								)}
							</Tabs.Panel>

							<Tabs.Panel value="requests">
								{requests.length === 0 ? (
									<Center py={40}>
										<Text c="dimmed" size="sm">
											No pending requests
										</Text>
									</Center>
								) : (
									<Stack gap={8}>
										{requests.map((contact) => {
											const other = contact.requester;
											return (
												<Box
													key={contact.id}
													style={{
														background: "#141414",
														border: "1px solid #2a2a2a",
														borderRadius: 12,
														padding: "12px 14px"
													}}
												>
													<Group
														justify="space-between"
														wrap="nowrap"
													>
														<Group
															gap={10}
															wrap="nowrap"
														>
															<Avatar
																radius="xl"
																size="md"
																color="violet"
																style={{
																	background:
																		"#2a2a2a"
																}}
															>
																{userInitials(
																	other
																)}
															</Avatar>
															<Stack gap={0}>
																<Text
																	size="sm"
																	fw={600}
																>
																	{userLabel(
																		other
																	)}
																</Text>
																{other?.username && (
																	<Text
																		size="xs"
																		c="dimmed"
																	>
																		@
																		{
																			other.username
																		}
																	</Text>
																)}
															</Stack>
														</Group>
														<Group gap={6}>
															<Button
																size="xs"
																color="violet"
																onClick={() =>
																	handleAccept(
																		contact.id
																	)
																}
																style={{
																	background:
																		"linear-gradient(135deg, #6c63ff, #8b85ff)"
																}}
															>
																Accept
															</Button>
															<Button
																size="xs"
																variant="subtle"
																color="gray"
																onClick={() =>
																	handleDecline(
																		contact.id
																	)
																}
															>
																Decline
															</Button>
														</Group>
													</Group>
												</Box>
											);
										})}
									</Stack>
								)}
							</Tabs.Panel>

							<Tabs.Panel value="sent">
								{sent.length === 0 ? (
									<Center py={40}>
										<Text c="dimmed" size="sm">
											No sent requests
										</Text>
									</Center>
								) : (
									<Stack gap={8}>
										{sent.map((contact) => {
											const other = contact.addressee;
											return (
												<Box
													key={contact.id}
													style={{
														background: "#141414",
														border: "1px solid #2a2a2a",
														borderRadius: 12,
														padding: "12px 14px"
													}}
												>
													<Group
														justify="space-between"
														wrap="nowrap"
													>
														<Group
															gap={10}
															wrap="nowrap"
														>
															<Avatar
																radius="xl"
																size="md"
																color="violet"
																style={{
																	background:
																		"#2a2a2a"
																}}
															>
																{userInitials(
																	other
																)}
															</Avatar>
															<Stack gap={0}>
																<Text
																	size="sm"
																	fw={600}
																>
																	{userLabel(
																		other
																	)}
																</Text>
																{other?.username && (
																	<Text
																		size="xs"
																		c="dimmed"
																	>
																		@
																		{
																			other.username
																		}
																	</Text>
																)}
															</Stack>
														</Group>
														<Badge
															variant="outline"
															color="yellow"
															size="sm"
														>
															Pending
														</Badge>
													</Group>
												</Box>
											);
										})}
									</Stack>
								)}
							</Tabs.Panel>
						</>
					)}
				</Box>
			</Tabs>
		</Box>
	);
};

export default ContactsPage;

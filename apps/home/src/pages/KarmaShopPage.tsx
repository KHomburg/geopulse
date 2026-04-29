import { useEffect, useState } from "react";
import {
	Badge,
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
import { userApi, type CurrentUser, type KarmaPerk } from "../api/user.api";
import { getApiErrorMessage } from "../utils/apiErrors";

const KarmaShopPage = () => {
	const navigate = useNavigate();
	const accountNotice = useAuthStore((state) => state.accountNotice);
	const isWriteBlocked = accountNotice?.kind === "read_only";
	const [user, setUser] = useState<CurrentUser | null>(null);
	const [perks, setPerks] = useState<KarmaPerk[]>([]);
	const [loading, setLoading] = useState(true);
	const [purchasingKey, setPurchasingKey] = useState<KarmaPerk["key"] | null>(
		null
	);
	const [error, setError] = useState<string | null>(null);

	const load = async () => {
		setLoading(true);
		try {
			const [{ data: currentUser }, { data: perkData }] =
				await Promise.all([userApi.getMe(), userApi.getPerks()]);
			setUser(currentUser);
			setPerks(perkData.data);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void load();
	}, []);

	const handlePurchase = async (key: KarmaPerk["key"]) => {
		if (isWriteBlocked) {
			return;
		}

		setPurchasingKey(key);
		try {
			const { data } = await userApi.purchasePerk(key);
			setUser(data);
			setError(null);
			await load();
		} catch (err: unknown) {
			setError(getApiErrorMessage(err, "Failed to unlock perk"));
		} finally {
			setPurchasingKey(null);
		}
	};

	return (
		<Box
			style={{
				height: "100%",
				overflowY: "auto",
				background: "#0a0a0a",
				padding: "20px 16px"
			}}
		>
			<Group justify="space-between" mb={20}>
				<Button
					variant="subtle"
					color="gray"
					onClick={() => navigate(-1)}
				>
					← Back
				</Button>
				<Text fw={700}>Karma Shop</Text>
				<Box w={60} />
			</Group>

			{loading ? (
				<Center py={80}>
					<Loader color="violet" />
				</Center>
			) : (
				<Stack gap="md">
					{accountNotice?.kind === "read_only" && (
						<Text size="sm" c="yellow">
							{accountNotice.message}
						</Text>
					)}
					{error && (
						<Text size="sm" c="red">
							{error}
						</Text>
					)}

					<Paper
						radius="lg"
						style={{
							background:
								"linear-gradient(135deg, #141414, #1d1d1d)",
							border: "1px solid #2a2a2a",
							padding: 18
						}}
					>
						<Group justify="space-between" align="flex-start">
							<Box>
								<Text
									size="xs"
									c="dimmed"
									tt="uppercase"
									fw={700}
								>
									Current Balance
								</Text>
								<Text
									size="2rem"
									fw={800}
									style={{ color: "#ffcf66" }}
								>
									{user?.karmaScore ?? 0}
								</Text>
								<Text size="sm" c="dimmed">
									{user?.superPostCredits ?? 0} super-post
									credits ready
								</Text>
							</Box>
							<Badge
								color={user?.isTrusted ? "green" : "gray"}
								variant="light"
							>
								{user?.isTrusted
									? "Trusted Local"
									: "Building trust"}
							</Badge>
						</Group>
					</Paper>

					{perks.map((perk) => (
						<Paper
							key={perk.key}
							radius="lg"
							style={{
								background: "#141414",
								border: "1px solid #2a2a2a",
								padding: 16
							}}
						>
							<Group
								justify="space-between"
								align="flex-start"
								wrap="nowrap"
							>
								<Box>
									<Group gap={8} mb={6}>
										<Text fw={700}>{perk.label}</Text>
										<Badge variant="outline" color="yellow">
											{perk.cost} karma
										</Badge>
									</Group>
									<Text size="sm" c="dimmed" mb={10}>
										{perk.description}
									</Text>
									<Text size="sm">
										Preview: {String(perk.previewValue)}
									</Text>
								</Box>
								<Button
									variant={perk.owned ? "light" : "filled"}
									color={perk.owned ? "gray" : "violet"}
									disabled={
										isWriteBlocked ||
										perk.owned ||
										!perk.affordable
									}
									loading={purchasingKey === perk.key}
									onClick={() => handlePurchase(perk.key)}
								>
									{perk.owned
										? "Owned"
										: isWriteBlocked
										? "Read-only"
										: perk.affordable
										? "Unlock"
										: "Need more karma"}
								</Button>
							</Group>
						</Paper>
					))}
				</Stack>
			)}
		</Box>
	);
};

export default KarmaShopPage;

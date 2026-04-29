import { useEffect, useState } from "react";
import { ActionIcon, Box, Group, Text } from "@mantine/core";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

interface PostMediaGalleryProps {
	mediaUrls: string[];
	aspectRatio?: string;
	borderRadius?: number;
}

const PostMediaGallery = ({
	mediaUrls,
	aspectRatio = "4 / 5",
	borderRadius = 16
}: PostMediaGalleryProps) => {
	const [activeIndex, setActiveIndex] = useState(0);

	useEffect(() => {
		if (activeIndex >= mediaUrls.length) {
			setActiveIndex(0);
		}
	}, [activeIndex, mediaUrls.length]);

	if (!mediaUrls.length) {
		return null;
	}

	const hasMultipleImages = mediaUrls.length > 1;
	const activeUrl = mediaUrls[Math.min(activeIndex, mediaUrls.length - 1)];

	return (
		<Box>
			<Box
				style={{
					position: "relative",
					overflow: "hidden",
					borderRadius,
					border: "1px solid rgba(255,250,242,0.08)",
					background: "#11141b",
					boxShadow: "0 24px 60px rgba(0,0,0,0.26)"
				}}
			>
				<img
					src={activeUrl}
					alt={`Post image ${activeIndex + 1}`}
					loading="lazy"
					style={{
						display: "block",
						width: "100%",
						aspectRatio,
						objectFit: "cover",
						background: "#0f0f0f"
					}}
				/>
				<Box
					style={{
						position: "absolute",
						inset: 0,
						background:
							"linear-gradient(180deg, rgba(7,8,10,0.05) 0%, rgba(7,8,10,0.08) 45%, rgba(7,8,10,0.28) 100%)",
						pointerEvents: "none"
					}}
				/>

				{hasMultipleImages && (
					<>
						<Group
							justify="space-between"
							style={{
								position: "absolute",
								inset: "50% 10px auto",
								transform: "translateY(-50%)",
								pointerEvents: "none"
							}}
						>
							<ActionIcon
								variant="filled"
								radius="xl"
								size="sm"
								onClick={() =>
									setActiveIndex((current) =>
										current === 0
											? mediaUrls.length - 1
											: current - 1
									)
								}
								style={{
									pointerEvents: "auto",
									background: "rgba(12,14,18,0.7)",
									border: "1px solid rgba(255,250,242,0.12)",
									color: "#fffaf2"
								}}
							>
								<ChevronLeftIcon size={16} />
							</ActionIcon>
							<ActionIcon
								variant="filled"
								radius="xl"
								size="sm"
								onClick={() =>
									setActiveIndex(
										(current) =>
											(current + 1) % mediaUrls.length
									)
								}
								style={{
									pointerEvents: "auto",
									background: "rgba(12,14,18,0.7)",
									border: "1px solid rgba(255,250,242,0.12)",
									color: "#fffaf2"
								}}
							>
								<ChevronRightIcon size={16} />
							</ActionIcon>
						</Group>

						<Box
							style={{
								position: "absolute",
								top: 10,
								right: 10,
								padding: "4px 8px",
								borderRadius: 999,
								background: "rgba(12,14,18,0.74)",
								border: "1px solid rgba(255,250,242,0.08)"
							}}
						>
							<Text size="xs" fw={700} c="#fffaf2">
								{activeIndex + 1}/{mediaUrls.length}
							</Text>
						</Box>
					</>
				)}
			</Box>

			{hasMultipleImages && (
				<Group
					gap={8}
					mt={8}
					wrap="nowrap"
					style={{ overflowX: "auto", paddingBottom: 2 }}
				>
					{mediaUrls.map((mediaUrl, index) => {
						const isActive = index === activeIndex;

						return (
							<button
								key={`${mediaUrl}-${index}`}
								type="button"
								onClick={() => setActiveIndex(index)}
								style={{
									padding: 0,
									borderRadius: 12,
									border: isActive
										? "2px solid #c4874d"
										: "1px solid rgba(255,250,242,0.08)",
									overflow: "hidden",
									background: "#11141b",
									cursor: "pointer",
									flexShrink: 0
								}}
							>
								<img
									src={mediaUrl}
									alt={`Post thumbnail ${index + 1}`}
									loading="lazy"
									style={{
										display: "block",
										width: 58,
										height: 58,
										objectFit: "cover",
										opacity: isActive ? 1 : 0.68
									}}
								/>
							</button>
						);
					})}
				</Group>
			)}
		</Box>
	);
};

export default PostMediaGallery;

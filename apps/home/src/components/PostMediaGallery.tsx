import { useEffect, useState } from "react";
import { ActionIcon, Box, Group, Text } from "@mantine/core";

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
					border: "1px solid #2a2a2a",
					background: "#101010"
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
									background: "rgba(10,10,10,0.72)",
									border: "1px solid rgba(255,255,255,0.12)"
								}}
							>
								‹
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
									background: "rgba(10,10,10,0.72)",
									border: "1px solid rgba(255,255,255,0.12)"
								}}
							>
								›
							</ActionIcon>
						</Group>

						<Box
							style={{
								position: "absolute",
								top: 10,
								right: 10,
								padding: "4px 8px",
								borderRadius: 999,
								background: "rgba(10,10,10,0.72)",
								border: "1px solid rgba(255,255,255,0.08)"
							}}
						>
							<Text size="xs" fw={700} c="white">
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
										? "2px solid #6c63ff"
										: "1px solid #2a2a2a",
									overflow: "hidden",
									background: "#101010",
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

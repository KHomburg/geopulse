import type { ReactNode, SVGProps } from "react";

export interface IconProps extends SVGProps<SVGSVGElement> {
	size?: number;
	strokeWidth?: number;
}

interface BaseIconProps extends IconProps {
	children: ReactNode;
	filled?: boolean;
}

const BaseIcon = ({
	children,
	size = 20,
	strokeWidth = 1.85,
	filled = false,
	...props
}: BaseIconProps) => (
	<svg
		viewBox="0 0 24 24"
		width={size}
		height={size}
		fill={filled ? "currentColor" : "none"}
		stroke="currentColor"
		strokeWidth={strokeWidth}
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
		focusable="false"
		{...props}
	>
		{children}
	</svg>
);

export const BrandPulseIcon = (props: IconProps) => (
	<BaseIcon {...props}>
		<path d="M12 20.5c3.6-3.18 6-6.18 6-10.02A5.99 5.99 0 0 0 12 4.5a5.99 5.99 0 0 0-6 5.98c0 3.84 2.4 6.84 6 10.02Z" />
		<path d="M12 8.4v4.4" />
		<path d="M9.75 10.65h4.5" />
	</BaseIcon>
);

export const MapIcon = (props: IconProps) => (
	<BaseIcon {...props}>
		<path d="m3 6 5.5-2 7 3 5.5-2v13l-5.5 2-7-3L3 19Z" />
		<path d="M8.5 4v13" />
		<path d="M15.5 7v13" />
	</BaseIcon>
);

export const FeedIcon = (props: IconProps) => (
	<BaseIcon {...props}>
		<path d="M13 2 5 13h5l-1 9 8-11h-5l1-9Z" />
	</BaseIcon>
);

export const CreateIcon = (props: IconProps) => (
	<BaseIcon {...props}>
		<rect x="4" y="4" width="16" height="16" rx="4" />
		<path d="M12 8v8" />
		<path d="M8 12h8" />
	</BaseIcon>
);

export const MessagesIcon = (props: IconProps) => (
	<BaseIcon {...props}>
		<path d="M6.5 17.5 3.5 20v-8.2A5.8 5.8 0 0 1 9.3 6h5.4a5.8 5.8 0 0 1 5.8 5.8v.4a5.8 5.8 0 0 1-5.8 5.8Z" />
		<path d="M8.5 11.5h7" />
		<path d="M8.5 14.5h4.5" />
	</BaseIcon>
);

export const ProfileIcon = (props: IconProps) => (
	<BaseIcon {...props}>
		<path d="M18.5 19a6.5 6.5 0 0 0-13 0" />
		<circle cx="12" cy="8" r="3.5" />
		<path d="M4 19.5h16" opacity="0.18" />
	</BaseIcon>
);

export const BellIcon = (props: IconProps) => (
	<BaseIcon {...props}>
		<path d="M7.5 15.5V10a4.5 4.5 0 1 1 9 0v5.5l1.5 1.5H6Z" />
		<path d="M10 18.5a2 2 0 0 0 4 0" />
	</BaseIcon>
);

export const SearchIcon = (props: IconProps) => (
	<BaseIcon {...props}>
		<circle cx="11" cy="11" r="6.5" />
		<path d="m16 16 4 4" />
	</BaseIcon>
);

export const ShieldIcon = (props: IconProps) => (
	<BaseIcon {...props}>
		<path d="M12 4 5.5 6.5v4.2c0 4.1 2.5 7.55 6.5 8.8 4-1.25 6.5-4.7 6.5-8.8V6.5Z" />
		<path d="m9.75 12 1.5 1.5 3.25-3.5" />
	</BaseIcon>
);

export const ArrowUpIcon = (props: IconProps) => (
	<BaseIcon {...props}>
		<path d="m12 5-4.5 5" />
		<path d="m12 5 4.5 5" />
		<path d="M12 5v14" />
	</BaseIcon>
);

export const ArrowDownIcon = (props: IconProps) => (
	<BaseIcon {...props}>
		<path d="m12 19-4.5-5" />
		<path d="m12 19 4.5-5" />
		<path d="M12 5v14" />
	</BaseIcon>
);

export const CommentIcon = (props: IconProps) => (
	<BaseIcon {...props}>
		<path d="M6 17.5 4 20v-9a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v1a5 5 0 0 1-5 5Z" />
	</BaseIcon>
);

export const BookmarkIcon = (props: IconProps) => (
	<BaseIcon {...props}>
		<path d="M7 4.5h10v15l-5-3.5-5 3.5Z" />
	</BaseIcon>
);

export const BookmarkFilledIcon = (props: IconProps) => (
	<BaseIcon {...props} filled>
		<path d="M7 4.5h10v15l-5-3.5-5 3.5Z" stroke="none" />
	</BaseIcon>
);

export const TrashIcon = (props: IconProps) => (
	<BaseIcon {...props}>
		<path d="M4.5 7.5h15" />
		<path d="M9.5 7.5V5.75A1.75 1.75 0 0 1 11.25 4h1.5a1.75 1.75 0 0 1 1.75 1.75V7.5" />
		<path d="m7.5 7.5.7 11a1.5 1.5 0 0 0 1.5 1.4h4.6a1.5 1.5 0 0 0 1.5-1.4l.7-11" />
	</BaseIcon>
);

export const CloseIcon = (props: IconProps) => (
	<BaseIcon {...props}>
		<path d="m6 6 12 12" />
		<path d="M18 6 6 18" />
	</BaseIcon>
);

export const ChevronLeftIcon = (props: IconProps) => (
	<BaseIcon {...props}>
		<path d="m14.5 6-5.5 6 5.5 6" />
	</BaseIcon>
);

export const ChevronRightIcon = (props: IconProps) => (
	<BaseIcon {...props}>
		<path d="m9.5 6 5.5 6-5.5 6" />
	</BaseIcon>
);

export const RefreshIcon = (props: IconProps) => (
	<BaseIcon {...props}>
		<path d="M19 8.5V4h-4.5" />
		<path d="M19 4a8 8 0 1 0 2 6" />
	</BaseIcon>
);

export const LocationIcon = (props: IconProps) => (
	<BaseIcon {...props}>
		<path d="M12 20.25c3.25-2.9 5.25-5.5 5.25-8.65A5.25 5.25 0 1 0 6.75 11.6c0 3.15 2 5.75 5.25 8.65Z" />
		<circle cx="12" cy="11.25" r="1.85" />
	</BaseIcon>
);

export const GalleryIcon = (props: IconProps) => (
	<BaseIcon {...props}>
		<rect x="3.5" y="5" width="17" height="14" rx="3" />
		<path d="m7.5 15 3-3 2.5 2.5L15.5 12l3 3" />
		<circle cx="9" cy="9" r="1.25" />
	</BaseIcon>
);

export const CameraIcon = (props: IconProps) => (
	<BaseIcon {...props}>
		<path d="M5.5 8.5h3l1.2-2h4.6l1.2 2h3a2 2 0 0 1 2 2v6.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V10.5a2 2 0 0 1 2-2Z" />
		<circle cx="12" cy="13.5" r="3" />
	</BaseIcon>
);

export const GlobeIcon = (props: IconProps) => (
	<BaseIcon {...props}>
		<circle cx="12" cy="12" r="8" />
		<path d="M4.5 12h15" />
		<path d="M12 4a12 12 0 0 1 0 16" />
		<path d="M12 4a12 12 0 0 0 0 16" />
	</BaseIcon>
);

export const AliasIcon = (props: IconProps) => (
	<BaseIcon {...props}>
		<path d="M7 16.5 5.5 19 4 16.5V9a8 8 0 0 1 16 0v7.5L18.5 19 17 16.5" />
		<path d="M8.5 12.5h7" />
		<path d="M8.5 9.5h7" />
	</BaseIcon>
);

export const AnonymousIcon = (props: IconProps) => (
	<BaseIcon {...props}>
		<path d="M12 4 5.5 6.5v4.2c0 4.1 2.5 7.55 6.5 8.8 4-1.25 6.5-4.7 6.5-8.8V6.5Z" />
		<path d="M9.5 10.5h5" />
		<path d="M10 13.5h4" />
	</BaseIcon>
);

export const TicketIcon = (props: IconProps) => (
	<BaseIcon {...props}>
		<path d="M4 9.5a2.5 2.5 0 1 0 0 5v2.5h16V14.5a2.5 2.5 0 1 1 0-5V7H4Z" />
		<path d="M12 7v10" strokeDasharray="1.8 2.2" />
	</BaseIcon>
);

export const NewsIcon = (props: IconProps) => (
	<BaseIcon {...props}>
		<path d="M6 5h10a2 2 0 0 1 2 2v10H8a2 2 0 0 1-2-2Z" />
		<path d="M8 9h7" />
		<path d="M8 12h7" />
		<path d="M8 15h4" />
	</BaseIcon>
);

export const AlertIcon = (props: IconProps) => (
	<BaseIcon {...props}>
		<path d="M12 4.5 4.5 18h15Z" />
		<path d="M12 9v4.5" />
		<path d="M12 16.5h.01" />
	</BaseIcon>
);

export const PartyIcon = (props: IconProps) => (
	<BaseIcon {...props}>
		<path d="m6 18 6-12 6 4-9 8Z" />
		<path d="M14.5 6.5 17 4" />
		<path d="M18 9.5h2.5" />
		<path d="m15.5 12.5 1.5 2.5" />
	</BaseIcon>
);

export const FoodIcon = (props: IconProps) => (
	<BaseIcon {...props}>
		<path d="M7 4.5v5" />
		<path d="M5.5 4.5v5" />
		<path d="M8.5 4.5v5" />
		<path d="M7 9.5V20" />
		<path d="M14 4.5c1.7 1 2.5 2.4 2.5 4.25S15.7 12 14 13v7" />
	</BaseIcon>
);

export const SparkIcon = (props: IconProps) => (
	<BaseIcon {...props}>
		<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z" />
	</BaseIcon>
);

export const SendIcon = (props: IconProps) => (
	<BaseIcon {...props}>
		<path d="M4 11.5 20 4l-4.5 16-3.2-5.3L4 11.5Z" />
	</BaseIcon>
);

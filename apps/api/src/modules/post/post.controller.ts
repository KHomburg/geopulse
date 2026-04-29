import { Request, Response } from "express";
import PostService from "./post.service";
import {
	CreatePostSchema,
	GetPostsQuerySchema,
	PostIdParamSchema,
	GetHotspotsQuerySchema
} from "./post.schemas";
import { haversineDistanceMeters, resolveAuthorDisplay } from "./post.utils";
import type { AnonymityMode } from "./post.model";

function parseTags(tags: string | null | undefined) {
	return tags ? tags.split(",").filter(Boolean) : [];
}

function sanitizePost(
	post: Record<string, unknown>,
	requesterId?: number,
	requesterCoords?: { lat: number; lng: number }
) {
	const p = post as {
		id: number;
		userId: number;
		content: string;
		mediaUrl: string | null;
		anonymityMode: AnonymityMode;
		pseudonym: string | null;
		obfuscatedLat: number;
		obfuscatedLng: number;
		karmaScore: number;
		postType: "standard" | "drop";
		tags: string | null;
		dropHint: string | null;
		dropUnlockRadiusMeters: number | null;
		boostedUntil: Date | null;
		isStory: boolean;
		isActive: boolean;
		expiresAt: Date | null;
		createdAt: Date;
		commentCount?: number;
		author?: {
			karmaScore: number;
			isTrusted: boolean;
			pinAvatar: string | null;
			usernameColor: string | null;
		};
	};

	const { authorId, authorPseudonym } = resolveAuthorDisplay(
		p.anonymityMode,
		p.userId,
		p.pseudonym
	);

	const tags = parseTags(p.tags);
	const unlockRadius = p.dropUnlockRadiusMeters ?? 20;
	const withinDropRadius =
		p.postType !== "drop" ||
		requesterId === p.userId ||
		(requesterCoords &&
			haversineDistanceMeters(
				requesterCoords.lat,
				requesterCoords.lng,
				p.obfuscatedLat,
				p.obfuscatedLng
			) <= unlockRadius);
	const isLocked = p.postType === "drop" && !withinDropRadius;
	const isSuperLocalLegend =
		p.boostedUntil != null &&
		new Date(p.boostedUntil).getTime() > Date.now();

	return {
		id: p.id,
		content: isLocked
			? `Drop locked · move within ${unlockRadius}m to reveal it`
			: p.content,
		previewContent: isLocked
			? p.dropHint ?? "Secret local drop nearby"
			: p.content,
		mediaUrl: isLocked ? null : p.mediaUrl,
		anonymityMode: p.anonymityMode,
		authorId,
		authorPseudonym,
		authorPinAvatar:
			p.anonymityMode === "anonymous"
				? null
				: p.author?.pinAvatar ?? null,
		authorNameColor:
			p.anonymityMode === "anonymous"
				? null
				: p.author?.usernameColor ?? null,
		authorKarma: p.author?.karmaScore ?? 0,
		authorTrusted: p.author?.isTrusted ?? false,
		lat: p.obfuscatedLat,
		lng: p.obfuscatedLng,
		karmaScore: p.karmaScore,
		postType: p.postType,
		tags,
		dropHint: p.dropHint,
		dropUnlockRadiusMeters: p.dropUnlockRadiusMeters,
		boostedUntil: p.boostedUntil,
		isSuperLocalLegend,
		isLocked,
		isStory: p.isStory,
		expiresAt: p.expiresAt,
		createdAt: p.createdAt,
		commentCount: Number(p.commentCount ?? 0),
		isOwner: requesterId != null ? p.userId === requesterId : false
	};
}

export const createPost = async (req: Request, res: Response) => {
	const userId = Number(req.id);
	const body = CreatePostSchema.parse(req.body);

	if (body.anonymityMode === "local_legend" && !body.pseudonym) {
		return res
			.status(400)
			.json({ message: "pseudonym is required for local_legend mode" });
	}

	if (body.isSuperLocalLegend && body.anonymityMode !== "local_legend") {
		return res.status(400).json({
			message: "Super Local Legend posts must use local_legend mode"
		});
	}

	const post = await PostService.createPost({ ...body, userId });
	const plain = typeof post.toJSON === "function" ? post.toJSON() : post;
	return res
		.status(201)
		.json(sanitizePost(plain, userId, { lat: body.lat, lng: body.lng }));
};

export const getPost = async (req: Request, res: Response) => {
	const { id } = PostIdParamSchema.parse(req.params);
	const post = await PostService.getPostById(id);
	if (!post) return res.status(404).json({ message: "Post not found" });
	const plain = typeof post.toJSON === "function" ? post.toJSON() : post;
	const requesterId = req.id ? Number(req.id) : undefined;
	const lat = Number(req.query.lat);
	const lng = Number(req.query.lng);
	const requesterCoords =
		Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : undefined;
	return res
		.status(200)
		.json(sanitizePost(plain, requesterId, requesterCoords));
};

export const getFeed = async (req: Request, res: Response) => {
	const query = GetPostsQuerySchema.parse(req.query);
	const tags = query.tags
		? query.tags
				.split(",")
				.map((tag) => tag.trim().toLowerCase())
				.filter(Boolean)
		: [];
	const posts = await PostService.getFeed({ ...query, tags });
	const requesterId = req.id ? Number(req.id) : undefined;
	const data = posts.map((p) => {
		const plain = typeof p.toJSON === "function" ? p.toJSON() : p;
		return sanitizePost(plain as Record<string, unknown>, requesterId, {
			lat: query.lat,
			lng: query.lng
		});
	});
	return res.status(200).json({ data, count: data.length });
};

export const getTrustedFeed = async (req: Request, res: Response) => {
	const query = GetPostsQuerySchema.parse(req.query);
	const tags = query.tags
		? query.tags
				.split(",")
				.map((tag) => tag.trim().toLowerCase())
				.filter(Boolean)
		: [];
	const posts = await PostService.getTrustedFeed({
		...query,
		userId: Number(req.id),
		tags
	});
	const data = posts.map((p) => {
		const plain = typeof p.toJSON === "function" ? p.toJSON() : p;
		return sanitizePost(plain as Record<string, unknown>, Number(req.id), {
			lat: query.lat,
			lng: query.lng
		});
	});
	return res.status(200).json({ data, count: data.length });
};

export const deletePost = async (req: Request, res: Response) => {
	const userId = Number(req.id);
	const { id } = PostIdParamSchema.parse(req.params);
	const deleted = await PostService.deletePost(id, userId);
	if (!deleted)
		return res
			.status(404)
			.json({ message: "Post not found or not owned by user" });
	return res.status(200).json({ message: "Post deleted" });
};

export const getHotspots = async (req: Request, res: Response) => {
	const query = GetHotspotsQuerySchema.parse(req.query);
	const hotspots = await PostService.getHotspots(query);
	return res.status(200).json({ data: hotspots, count: hotspots.length });
};

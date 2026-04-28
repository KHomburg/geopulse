import { Request, Response } from "express";
import PostService from "./post.service";
import {
	CreatePostSchema,
	GetPostsQuerySchema,
	PostIdParamSchema,
	GetHotspotsQuerySchema
} from "./post.schemas";
import { resolveAuthorDisplay } from "./post.utils";
import type { AnonymityMode } from "./post.model";

function sanitizePost(post: Record<string, unknown>, requesterId?: number) {
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
		isStory: boolean;
		isActive: boolean;
		expiresAt: Date | null;
		createdAt: Date;
	};

	const { authorId, authorPseudonym } = resolveAuthorDisplay(
		p.anonymityMode,
		p.userId,
		p.pseudonym
	);

	return {
		id: p.id,
		content: p.content,
		mediaUrl: p.mediaUrl,
		anonymityMode: p.anonymityMode,
		authorId,
		authorPseudonym,
		lat: p.obfuscatedLat,
		lng: p.obfuscatedLng,
		karmaScore: p.karmaScore,
		isStory: p.isStory,
		expiresAt: p.expiresAt,
		createdAt: p.createdAt,
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

	const post = await PostService.createPost({ ...body, userId });
	const plain = typeof post.toJSON === "function" ? post.toJSON() : post;
	return res.status(201).json(sanitizePost(plain, userId));
};

export const getPost = async (req: Request, res: Response) => {
	const { id } = PostIdParamSchema.parse(req.params);
	const post = await PostService.getPostById(id);
	if (!post) return res.status(404).json({ message: "Post not found" });
	const plain = typeof post.toJSON === "function" ? post.toJSON() : post;
	const requesterId = req.id ? Number(req.id) : undefined;
	return res.status(200).json(sanitizePost(plain, requesterId));
};

export const getFeed = async (req: Request, res: Response) => {
	const query = GetPostsQuerySchema.parse(req.query);
	const posts = await PostService.getFeed(query);
	const requesterId = req.id ? Number(req.id) : undefined;
	const data = posts.map((p) => {
		const plain = typeof p.toJSON === "function" ? p.toJSON() : p;
		return sanitizePost(plain as Record<string, unknown>, requesterId);
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

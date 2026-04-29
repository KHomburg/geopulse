//#region Import
import { Request, Response } from "express";
import UserService from "./user.service";
import {
	CreateUserSchema,
	UpdateUserSchema,
	UpdateUserEmailSchema,
	UserParamsSchema
} from "./user.schemas";

// TODO: add authentication middleware

export const GetUser = async (
	req: Request,
	res: Response
): Promise<Response> => {
	try {
		const params = UserParamsSchema.parse(req.params);

		const user = await UserService.getUserById(params.id);
		if (!user) return res.status(404).json({ message: "User not found" });
		return res.status(200).json(user);
	} catch (error: unknown) {
		console.error(error);
		return res.status(500).json({ message: "Internal server error" });
	}
};

export const GetUsers = async (
	req: Request,
	res: Response
): Promise<Response> => {
	try {
		const users = await UserService.getUsers();
		return res.status(200).json(users);
	} catch (error: unknown) {
		console.error(error);
		return res.status(500).json({ message: "Internal server error" });
	}
};

export const CreateUser = async (
	req: Request,
	res: Response
): Promise<Response> => {
	try {
		const dto = CreateUserSchema.parse(req.body);

		const newUser = await UserService.createUser(dto as any);
		return res.status(201).json(newUser);
	} catch (error: unknown) {
		console.log(error);
		return res.status(500).json({ message: "Internal server error" });
	}
};

export const DeleteUser = async (
	req: Request,
	res: Response
): Promise<Response> => {
	try {
		const params = UserParamsSchema.parse(req.params);

		const deleted = await UserService.deleteUser(params.id);
		if (!deleted)
			return res.status(404).json({ message: "User not found" });
		return res.status(200).json({ message: "User deleted" });
	} catch (error: unknown) {
		console.error(error);
		return res.status(500).json({ message: "Internal server error" });
	}
};
export const UpdateUser = async (
	req: Request,
	res: Response
): Promise<Response> => {
	try {
		const params = UserParamsSchema.parse(req.params);
		const dto = UpdateUserSchema.parse(req.body);

		const updatedUser = await UserService.updateUser(params.id, dto as any);
		if (!updatedUser)
			return res.status(404).json({ message: "User not found" });
		return res.status(200).json(updatedUser);
	} catch (error: unknown) {
		console.error(error);
		return res.status(500).json({ message: "Internal server error" });
	}
};
export const UpdateUserEmail = async (
	req: Request,
	res: Response
): Promise<Response> => {
	try {
		const params = UserParamsSchema.parse(req.params);
		const dto = UpdateUserEmailSchema.parse(req.body);

		const updatedUser = await UserService.updateUserEmail(
			params.id,
			dto.email
		);
		if (!updatedUser)
			return res.status(404).json({ message: "User not found" });
		return res.status(200).json(updatedUser);
	} catch (error: unknown) {
		console.error(error);
		return res.status(500).json({ message: "Internal server error" });
	}
};

export const SearchUsers = async (
	req: Request,
	res: Response
): Promise<Response> => {
	try {
		const q = String(req.query.q ?? "").trim();
		if (!q || q.length < 2) {
			return res
				.status(400)
				.json({ message: "Query must be at least 2 characters" });
		}
		const users = await UserService.searchUsers(q);
		return res.status(200).json({ data: users });
	} catch (error: unknown) {
		console.error(error);
		return res.status(500).json({ message: "Internal server error" });
	}
};

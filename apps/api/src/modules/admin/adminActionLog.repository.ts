import AdminActionLog from "./adminActionLog.model";
import User from "../user/user.model";

const ACTOR_ATTRS = ["id", "email", "username", "displayName", "role"];

export const AdminActionLogRepository = {
	async create(payload: Record<string, unknown>) {
		return AdminActionLog.create(payload as any);
	},

	async findRecent(limit = 50) {
		return AdminActionLog.findAll({
			include: [
				{
					model: User,
					as: "actor",
					attributes: ACTOR_ATTRS,
					required: false
				}
			],
			order: [["createdAt", "DESC"]],
			limit
		});
	}
};

export default AdminActionLogRepository;

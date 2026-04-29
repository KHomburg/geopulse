import { Op } from "sequelize";
import Report from "./report.model";
import User from "../user/user.model";
import {
	ACTIVE_REPORT_STATUSES,
	type ReportContentType,
	type ReportStatus
} from "../../shared/moderation/moderation.types";

const REPORTER_ATTRS = [
	"id",
	"email",
	"username",
	"displayName",
	"karmaScore",
	"isTrusted",
	"role"
];

export const ReportRepository = {
	async create(payload: Record<string, unknown>) {
		return Report.create(payload as any);
	},

	async findById(id: number) {
		return Report.findByPk(id, {
			include: [
				{
					model: User,
					as: "reporter",
					attributes: REPORTER_ATTRS,
					required: false
				}
			]
		});
	},

	async findExistingActiveReport(
		reporterId: number,
		contentType: ReportContentType,
		targetId: number
	) {
		return Report.findOne({
			where: {
				reporterId,
				contentType,
				targetId,
				status: { [Op.in]: ACTIVE_REPORT_STATUSES }
			}
		});
	},

	async findActiveByTarget(contentType: ReportContentType, targetId: number) {
		return Report.findAll({
			where: {
				contentType,
				targetId,
				status: { [Op.in]: ACTIVE_REPORT_STATUSES }
			},
			order: [["createdAt", "DESC"]]
		});
	},

	async findQueueReports(limit = 100) {
		return Report.findAll({
			where: { status: { [Op.in]: ACTIVE_REPORT_STATUSES } },
			include: [
				{
					model: User,
					as: "reporter",
					attributes: REPORTER_ATTRS,
					required: false
				}
			],
			order: [["createdAt", "DESC"]],
			limit
		});
	},

	async updateStatusesForTarget(
		contentType: ReportContentType,
		targetId: number,
		toStatus: ReportStatus
	) {
		const [affected] = await Report.update(
			{ status: toStatus },
			{
				where: {
					contentType,
					targetId,
					status: { [Op.in]: ACTIVE_REPORT_STATUSES }
				}
			}
		);
		return affected;
	}
};

export default ReportRepository;

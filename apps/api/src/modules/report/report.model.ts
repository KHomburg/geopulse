import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../shared/config/sequelize.config";
import {
	REPORT_CATEGORIES,
	REPORT_CONTENT_TYPES,
	REPORT_STATUSES,
	type ReportCategory,
	type ReportContentType,
	type ReportStatus
} from "../../shared/moderation/moderation.types";

export class Report extends Model {
	declare id: number;
	declare contentType: ReportContentType;
	declare targetId: number;
	declare targetUserId: number | null;
	declare reporterId: number;
	declare category: ReportCategory;
	declare reason: string | null;
	declare reporterKarmaSnapshot: number;
	declare reporterTrustedSnapshot: boolean;
	declare status: ReportStatus;
	declare createdAt: Date;
	declare updatedAt: Date;
}

Report.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
			allowNull: false
		},
		contentType: {
			type: DataTypes.ENUM(...REPORT_CONTENT_TYPES),
			allowNull: false
		},
		targetId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		targetUserId: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		reporterId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		category: {
			type: DataTypes.ENUM(...REPORT_CATEGORIES),
			allowNull: false
		},
		reason: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		reporterKarmaSnapshot: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0
		},
		reporterTrustedSnapshot: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		},
		status: {
			type: DataTypes.ENUM(...REPORT_STATUSES),
			allowNull: false,
			defaultValue: "open"
		}
	},
	{
		sequelize,
		modelName: "Report",
		tableName: "report",
		timestamps: true
	}
);

export default Report;

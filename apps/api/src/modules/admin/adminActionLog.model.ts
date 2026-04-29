import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../shared/config/sequelize.config";

export class AdminActionLog extends Model {
	declare id: number;
	declare actorId: number;
	declare action: string;
	declare targetType: string;
	declare targetId: number;
	declare targetUserId: number | null;
	declare reason: string | null;
	declare details: Record<string, unknown> | null;
	declare createdAt: Date;
	declare updatedAt: Date;
}

AdminActionLog.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
			allowNull: false
		},
		actorId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		action: {
			type: DataTypes.STRING,
			allowNull: false
		},
		targetType: {
			type: DataTypes.STRING,
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
		reason: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		details: {
			type: DataTypes.JSON,
			allowNull: true
		}
	},
	{
		sequelize,
		modelName: "AdminActionLog",
		tableName: "admin_action_log",
		timestamps: true,
		updatedAt: false
	}
);

export default AdminActionLog;

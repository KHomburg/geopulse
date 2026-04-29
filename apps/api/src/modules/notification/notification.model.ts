import { sequelize } from "../../shared/config/sequelize.config";
import { DataTypes, Model } from "sequelize";

export type NotificationType =
	| "friend_request"
	| "friend_accepted"
	| "post_vote"
	| "post_comment"
	| "mention"
	| "system";

export class Notification extends Model {
	declare id: number;
	declare userId: number;
	declare type: NotificationType;
	declare message: string;
	declare referenceId: number | null;
	declare referenceType: string | null;
	declare isRead: boolean;
	declare actorId: number | null;
	declare createdAt: Date;
	declare updatedAt: Date;
}

Notification.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
			allowNull: false
		},
		userId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		type: {
			type: DataTypes.ENUM(
				"friend_request",
				"friend_accepted",
				"post_vote",
				"post_comment",
				"mention",
				"system"
			),
			allowNull: false
		},
		message: {
			type: DataTypes.STRING,
			allowNull: false
		},
		referenceId: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		referenceType: {
			type: DataTypes.STRING,
			allowNull: true
		},
		isRead: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		},
		actorId: {
			type: DataTypes.INTEGER,
			allowNull: true
		}
	},
	{
		sequelize,
		modelName: "Notification",
		tableName: "notification",
		timestamps: true
	}
);

export default Notification;

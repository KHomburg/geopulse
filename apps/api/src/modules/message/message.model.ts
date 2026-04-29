import { sequelize } from "../../shared/config/sequelize.config";
import { DataTypes, Model } from "sequelize";

export class Message extends Model {
	declare id: number;
	declare conversationId: number;
	declare senderId: number;
	declare content: string;
	declare readAt: Date | null;
	declare createdAt: Date;
	declare updatedAt: Date;
}

Message.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
			allowNull: false
		},
		conversationId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		senderId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		content: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		readAt: {
			type: DataTypes.DATE,
			allowNull: true,
			defaultValue: null
		}
	},
	{
		sequelize,
		modelName: "Message",
		tableName: "message",
		timestamps: true
	}
);

export default Message;

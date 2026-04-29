import { sequelize } from "../../shared/config/sequelize.config";
import { DataTypes, Model } from "sequelize";

export class ConversationParticipant extends Model {
	declare id: number;
	declare conversationId: number;
	declare userId: number;
	declare createdAt: Date;
	declare updatedAt: Date;
}

ConversationParticipant.init(
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
		userId: {
			type: DataTypes.INTEGER,
			allowNull: false
		}
	},
	{
		sequelize,
		modelName: "ConversationParticipant",
		tableName: "conversation_participant",
		timestamps: true,
		indexes: [
			{
				unique: true,
				fields: ["conversationId", "userId"]
			}
		]
	}
);

export default ConversationParticipant;

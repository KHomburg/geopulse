import { sequelize } from "../../shared/config/sequelize.config";
import { DataTypes, Model } from "sequelize";

export class Conversation extends Model {
	declare id: number;
	declare createdAt: Date;
	declare updatedAt: Date;
}

Conversation.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
			allowNull: false
		}
	},
	{
		sequelize,
		modelName: "Conversation",
		tableName: "conversation",
		timestamps: true
	}
);

export default Conversation;

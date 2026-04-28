import { sequelize } from "../../shared/config/sequelize.config";
import { DataTypes, Model } from "sequelize";

export type VoteValue = 1 | -1;

export class Vote extends Model {
	declare id: number;
	declare userId: number;
	declare postId: number;
	declare value: VoteValue;
	declare createdAt: Date;
	declare updatedAt: Date;
}

Vote.init(
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
		postId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		value: {
			type: DataTypes.INTEGER,
			allowNull: false,
			validate: {
				isIn: [[1, -1]]
			}
		}
	},
	{
		sequelize,
		modelName: "Vote",
		tableName: "vote",
		timestamps: true,
		indexes: [
			{
				unique: true,
				fields: ["userId", "postId"]
			}
		]
	}
);

export default Vote;

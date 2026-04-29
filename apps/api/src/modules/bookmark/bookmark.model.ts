import { sequelize } from "../../shared/config/sequelize.config";
import { DataTypes, Model } from "sequelize";

export class Bookmark extends Model {
	declare id: number;
	declare userId: number;
	declare postId: number;
	declare createdAt: Date;
	declare updatedAt: Date;
}

Bookmark.init(
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
		}
	},
	{
		sequelize,
		modelName: "Bookmark",
		tableName: "bookmark",
		timestamps: true,
		indexes: [
			{
				unique: true,
				fields: ["userId", "postId"]
			}
		]
	}
);

export default Bookmark;

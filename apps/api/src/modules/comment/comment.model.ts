import { sequelize } from "../../shared/config/sequelize.config";
import { DataTypes, Model } from "sequelize";

export class Comment extends Model {
	declare id: number;
	declare postId: number;
	declare userId: number;
	declare content: string;
	declare parentId: number | null;
	declare karmaScore: number;
	declare createdAt: Date;
	declare updatedAt: Date;
	declare deletedAt: Date | null;
}

Comment.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
			allowNull: false
		},
		postId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		userId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		content: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		parentId: {
			type: DataTypes.INTEGER,
			allowNull: true,
			defaultValue: null
		},
		karmaScore: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0
		}
	},
	{
		sequelize,
		modelName: "Comment",
		tableName: "comment",
		timestamps: true,
		paranoid: true
	}
);

export default Comment;

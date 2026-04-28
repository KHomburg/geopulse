import { sequelize } from "../../shared/config/sequelize.config";
import { DataTypes, Model } from "sequelize";
export class User extends Model {
	declare id: number;
	declare email: string;
	declare password: string;
	declare username: string | null;
	declare displayName: string | null;
	declare avatarUrl: string | null;
	declare karmaScore: number;
	declare isTrusted: boolean;
	declare createdAt: Date;
	declare updatedAt: Date;
	declare deletedAt: Date;
}
User.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
			allowNull: false
		},
		email: {
			type: DataTypes.STRING,
			unique: true
		},
		password: {
			type: DataTypes.STRING,
			allowNull: false
		},
		username: {
			type: DataTypes.STRING,
			allowNull: true,
			unique: true
		},
		displayName: {
			type: DataTypes.STRING,
			allowNull: true
		},
		avatarUrl: {
			type: DataTypes.STRING,
			allowNull: true
		},
		karmaScore: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0
		},
		isTrusted: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		}
	},
	{
		sequelize,
		modelName: "User",
		tableName: "user",
		timestamps: true,
		paranoid: true
	}
);
export default User;

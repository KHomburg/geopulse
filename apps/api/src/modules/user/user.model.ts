import { sequelize } from "../../shared/config/sequelize.config";
import { DataTypes, Model } from "sequelize";
export class User extends Model {
	declare id: number;
	declare email: string;
	declare password: string;
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
			type: DataTypes.STRING
		},
		password: {
			type: DataTypes.STRING,
			allowNull: false
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

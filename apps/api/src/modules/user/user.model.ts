import { sequelize } from "../../shared/config/sequelize.config";
import { DataTypes, Model } from "sequelize";
import {
	ACCOUNT_STATUSES,
	USER_ROLES,
	type AccountStatus,
	type UserRole
} from "../../shared/auth/auth.types";

export class User extends Model {
	declare id: number;
	declare email: string;
	declare password: string;
	declare username: string | null;
	declare displayName: string | null;
	declare avatarUrl: string | null;
	declare role: UserRole;
	declare accountStatus: AccountStatus;
	declare karmaScore: number;
	declare isTrusted: boolean;
	declare pinAvatar: string | null;
	declare usernameColor: string | null;
	declare superPostCredits: number;
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
		role: {
			type: DataTypes.ENUM(...USER_ROLES),
			allowNull: false,
			defaultValue: "user"
		},
		accountStatus: {
			type: DataTypes.ENUM(...ACCOUNT_STATUSES),
			allowNull: false,
			defaultValue: "active"
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
		},
		pinAvatar: {
			type: DataTypes.STRING,
			allowNull: true
		},
		usernameColor: {
			type: DataTypes.STRING,
			allowNull: true
		},
		superPostCredits: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0
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

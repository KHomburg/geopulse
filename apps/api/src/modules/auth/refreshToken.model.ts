import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../shared/config/sequelize.config";

export class RefreshToken extends Model {
	declare id: number;
	declare userId: number;
	declare token: string;
	declare revoked: boolean;
	declare expiresAt: Date;
	declare createdAt: Date;
	declare updatedAt: Date;
}

RefreshToken.init(
	{
		id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
		userId: { type: DataTypes.INTEGER, allowNull: false },
		token: { type: DataTypes.STRING, allowNull: false },
		revoked: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		},
		expiresAt: { type: DataTypes.DATE, allowNull: false }
	},
	{
		sequelize,
		modelName: "RefreshToken",
		tableName: "refresh_token",
		timestamps: true,
		paranoid: false
	}
);

export default RefreshToken;

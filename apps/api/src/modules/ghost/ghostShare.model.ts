import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../shared/config/sequelize.config";

export class GhostShare extends Model {
	declare id: number;
	declare userId: number;
	declare lat: number;
	declare lng: number;
	declare precisionMeters: number;
	declare expiresAt: Date;
	declare createdAt: Date;
	declare updatedAt: Date;
}

GhostShare.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
			allowNull: false
		},
		userId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			unique: true
		},
		lat: {
			type: DataTypes.FLOAT,
			allowNull: false
		},
		lng: {
			type: DataTypes.FLOAT,
			allowNull: false
		},
		precisionMeters: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 120
		},
		expiresAt: {
			type: DataTypes.DATE,
			allowNull: false
		}
	},
	{
		sequelize,
		modelName: "GhostShare",
		tableName: "ghost_share",
		timestamps: true
	}
);

export default GhostShare;

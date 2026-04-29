import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../shared/config/sequelize.config";

export type RoomType = "trusted_locals" | "live_lounge";

export class RoomMessage extends Model {
	declare id: number;
	declare roomType: RoomType;
	declare roomKey: string;
	declare userId: number;
	declare content: string;
	declare mediaUrl: string | null;
	declare createdAt: Date;
	declare updatedAt: Date;
}

RoomMessage.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
			allowNull: false
		},
		roomType: {
			type: DataTypes.ENUM("trusted_locals", "live_lounge"),
			allowNull: false
		},
		roomKey: {
			type: DataTypes.STRING,
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
		mediaUrl: {
			type: DataTypes.STRING,
			allowNull: true
		}
	},
	{
		sequelize,
		modelName: "RoomMessage",
		tableName: "room_message",
		timestamps: true
	}
);

export default RoomMessage;

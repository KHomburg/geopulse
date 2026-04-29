import { sequelize } from "../../shared/config/sequelize.config";
import { DataTypes, Model } from "sequelize";

export type ContactStatus = "pending" | "accepted" | "blocked";

export class Contact extends Model {
	declare id: number;
	declare requesterId: number;
	declare addresseeId: number;
	declare status: ContactStatus;
	declare createdAt: Date;
	declare updatedAt: Date;
}

Contact.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
			allowNull: false
		},
		requesterId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		addresseeId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		status: {
			type: DataTypes.ENUM("pending", "accepted", "blocked"),
			allowNull: false,
			defaultValue: "pending"
		}
	},
	{
		sequelize,
		modelName: "Contact",
		tableName: "contact",
		timestamps: true,
		indexes: [
			{
				unique: true,
				fields: ["requesterId", "addresseeId"]
			}
		]
	}
);

export default Contact;

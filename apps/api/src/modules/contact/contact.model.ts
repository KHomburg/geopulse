import { sequelize } from "../../shared/config/sequelize.config";
import { DataTypes, Model } from "sequelize";

export type ContactStatus = "pending" | "accepted" | "blocked";

export class Contact extends Model {
	declare id: number;
	declare requesterId: number;
	declare addresseeId: number;
	declare pairKey: string;
	declare status: ContactStatus;
	declare createdAt: Date;
	declare updatedAt: Date;
}

function buildPairKey(requesterId: number, addresseeId: number) {
	const [lowerUserId, higherUserId] = [requesterId, addresseeId].sort(
		(left, right) => left - right
	);
	return `${lowerUserId}:${higherUserId}`;
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
		pairKey: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true
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
		hooks: {
			beforeValidate(contact) {
				if (
					Number.isInteger(contact.requesterId) &&
					Number.isInteger(contact.addresseeId)
				) {
					contact.pairKey = buildPairKey(
						contact.requesterId,
						contact.addresseeId
					);
				}
			}
		},
		indexes: [
			{
				unique: true,
				fields: ["pairKey"]
			}
		]
	}
);

export default Contact;

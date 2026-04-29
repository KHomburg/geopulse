import { sequelize } from "../../shared/config/sequelize.config";
import { DataTypes, Model } from "sequelize";
import {
	MODERATION_STATUSES,
	type ModerationStatus
} from "../../shared/moderation/moderation.types";

export type AnonymityMode = "public" | "local_legend" | "anonymous";
export type TimeFilter = "now" | "today" | "week";
export type PostType = "standard" | "drop";

export class Post extends Model {
	declare id: number;
	declare userId: number;
	declare content: string;
	declare mediaUrl: string | null;
	declare anonymityMode: AnonymityMode;
	declare pseudonym: string | null;
	declare obfuscatedLat: number;
	declare obfuscatedLng: number;
	declare karmaScore: number;
	declare postType: PostType;
	declare tags: string | null;
	declare dropHint: string | null;
	declare dropUnlockRadiusMeters: number | null;
	declare boostedUntil: Date | null;
	declare moderationStatus: ModerationStatus;
	declare isStory: boolean;
	declare isActive: boolean;
	declare expiresAt: Date | null;
	declare createdAt: Date;
	declare updatedAt: Date;
	declare deletedAt: Date | null;
}

Post.init(
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
		content: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		mediaUrl: {
			type: DataTypes.STRING,
			allowNull: true
		},
		anonymityMode: {
			type: DataTypes.ENUM("public", "local_legend", "anonymous"),
			allowNull: false,
			defaultValue: "public"
		},
		pseudonym: {
			type: DataTypes.STRING,
			allowNull: true
		},
		obfuscatedLat: {
			type: DataTypes.FLOAT,
			allowNull: false
		},
		obfuscatedLng: {
			type: DataTypes.FLOAT,
			allowNull: false
		},
		karmaScore: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0
		},
		postType: {
			type: DataTypes.ENUM("standard", "drop"),
			allowNull: false,
			defaultValue: "standard"
		},
		tags: {
			type: DataTypes.STRING,
			allowNull: true
		},
		dropHint: {
			type: DataTypes.STRING,
			allowNull: true
		},
		dropUnlockRadiusMeters: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		boostedUntil: {
			type: DataTypes.DATE,
			allowNull: true
		},
		moderationStatus: {
			type: DataTypes.ENUM(...MODERATION_STATUSES),
			allowNull: false,
			defaultValue: "published"
		},
		isStory: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		},
		isActive: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: true
		},
		expiresAt: {
			type: DataTypes.DATE,
			allowNull: true
		}
	},
	{
		sequelize,
		modelName: "Post",
		tableName: "post",
		timestamps: true,
		paranoid: true
	}
);

export default Post;

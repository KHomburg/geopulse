import User from "../../modules/user/user.model";
import RefreshToken from "../../modules/auth/refreshToken.model";
import Post from "../../modules/post/post.model";
import Vote from "../../modules/vote/vote.model";
import Contact from "../../modules/contact/contact.model";
import Conversation from "../../modules/message/conversation.model";
import ConversationParticipant from "../../modules/message/conversationParticipant.model";
import Message from "../../modules/message/message.model";
import Notification from "../../modules/notification/notification.model";
import Comment from "../../modules/comment/comment.model";
import Bookmark from "../../modules/bookmark/bookmark.model";
import GhostShare from "../../modules/ghost/ghostShare.model";
import RoomMessage from "../../modules/room/roomMessage.model";
import Report from "../../modules/report/report.model";
import AdminActionLog from "../../modules/admin/adminActionLog.model";

// User <-> RefreshToken
User.hasMany(RefreshToken, { foreignKey: "userId", as: "refreshTokens" });
RefreshToken.belongsTo(User, { foreignKey: "userId", as: "user" });

// User <-> Post
User.hasMany(Post, { foreignKey: "userId", as: "posts" });
Post.belongsTo(User, { foreignKey: "userId", as: "author" });

// Post <-> Vote
Post.hasMany(Vote, { foreignKey: "postId", as: "votes" });
Vote.belongsTo(Post, { foreignKey: "postId", as: "post" });

// User <-> Vote
User.hasMany(Vote, { foreignKey: "userId", as: "votes" });
Vote.belongsTo(User, { foreignKey: "userId", as: "voter" });

// Contact (friendship)
User.hasMany(Contact, { foreignKey: "requesterId", as: "sentRequests" });
User.hasMany(Contact, { foreignKey: "addresseeId", as: "receivedRequests" });
Contact.belongsTo(User, { foreignKey: "requesterId", as: "requester" });
Contact.belongsTo(User, { foreignKey: "addresseeId", as: "addressee" });

// Conversation <-> ConversationParticipant
Conversation.hasMany(ConversationParticipant, {
	foreignKey: "conversationId",
	as: "participants"
});
Conversation.hasMany(ConversationParticipant, {
	foreignKey: "conversationId",
	as: "allParticipants"
});
ConversationParticipant.belongsTo(Conversation, {
	foreignKey: "conversationId",
	as: "conversation"
});
ConversationParticipant.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(ConversationParticipant, {
	foreignKey: "userId",
	as: "conversationMemberships"
});

// Conversation <-> Message
Conversation.hasMany(Message, {
	foreignKey: "conversationId",
	as: "messages"
});
Conversation.hasMany(Message, {
	foreignKey: "conversationId",
	as: "lastMessage"
});
Message.belongsTo(Conversation, {
	foreignKey: "conversationId",
	as: "conversation"
});
Message.belongsTo(User, { foreignKey: "senderId", as: "sender" });
User.hasMany(Message, { foreignKey: "senderId", as: "sentMessages" });

// Notification
User.hasMany(Notification, { foreignKey: "userId", as: "notifications" });
Notification.belongsTo(User, { foreignKey: "userId", as: "recipient" });
Notification.belongsTo(User, { foreignKey: "actorId", as: "actor" });

// Comment
Post.hasMany(Comment, { foreignKey: "postId", as: "comments" });
Comment.belongsTo(Post, { foreignKey: "postId", as: "post" });
Comment.belongsTo(User, { foreignKey: "userId", as: "author" });
User.hasMany(Comment, { foreignKey: "userId", as: "comments" });
// Self-referential for replies
Comment.hasMany(Comment, { foreignKey: "parentId", as: "replies" });
Comment.belongsTo(Comment, { foreignKey: "parentId", as: "parent" });

// Bookmark
User.hasMany(Bookmark, { foreignKey: "userId", as: "bookmarks" });
Bookmark.belongsTo(User, { foreignKey: "userId", as: "user" });
Post.hasMany(Bookmark, { foreignKey: "postId", as: "bookmarks" });
Bookmark.belongsTo(Post, { foreignKey: "postId", as: "post" });

// Ghost sharing
User.hasOne(GhostShare, { foreignKey: "userId", as: "ghostShare" });
GhostShare.belongsTo(User, { foreignKey: "userId", as: "user" });

// Room messages
User.hasMany(RoomMessage, { foreignKey: "userId", as: "roomMessages" });
RoomMessage.belongsTo(User, { foreignKey: "userId", as: "author" });

// Reports
User.hasMany(Report, { foreignKey: "reporterId", as: "reports" });
Report.belongsTo(User, { foreignKey: "reporterId", as: "reporter" });
User.hasMany(Report, {
	foreignKey: "targetUserId",
	as: "reportsAgainstUser"
});
Report.belongsTo(User, { foreignKey: "targetUserId", as: "targetUser" });

// Admin action logs
User.hasMany(AdminActionLog, { foreignKey: "actorId", as: "adminActions" });
AdminActionLog.belongsTo(User, { foreignKey: "actorId", as: "actor" });
User.hasMany(AdminActionLog, {
	foreignKey: "targetUserId",
	as: "adminActionsAgainstUser"
});
AdminActionLog.belongsTo(User, {
	foreignKey: "targetUserId",
	as: "targetUser"
});

import User from "../../modules/user/user.model";
import RefreshToken from "../../modules/auth/refreshToken.model";
import Post from "../../modules/post/post.model";
import Vote from "../../modules/vote/vote.model";

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

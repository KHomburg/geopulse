import User from "../../modules/user/user.model";
import RefreshToken from "../../modules/auth/refreshToken.model";

User.hasMany(RefreshToken, { foreignKey: "userId", as: "refreshTokens" });
RefreshToken.belongsTo(User, { foreignKey: "userId", as: "user" });

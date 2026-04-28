import rateLimit from "express-rate-limit";

export const globalLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 1000,
	standardHeaders: true,
	legacyHeaders: false
});

export const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 20,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: "Too many attempts, please try again later." },
	// Skip rate limiting outside production (e.g. local dev and E2E tests)
	skip: () => process.env.NODE_ENV !== "production"
});

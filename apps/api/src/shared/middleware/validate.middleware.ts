import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

type Part = "body" | "params" | "query";

export function validate(part: Part, schema: ZodSchema<any>) {
	return (req: Request, res: Response, next: NextFunction) => {
		const data = (req as any)[part];
		const result = schema.safeParse(data);
		if (!result.success) {
			return res
				.status(400)
				.json({
					message: "Validation failed",
					errors: result.error.flatten()
				});
		}
		(req as any)[part] = result.data;
		return next();
	};
}

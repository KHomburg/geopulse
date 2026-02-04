import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

export class RegisterDto {
	@IsNotEmpty()
	@IsEmail()
	email!: string;

	@IsNotEmpty()
	@MinLength(6)
	password!: string;
}

export class LoginDto {
	@IsNotEmpty()
	@IsEmail()
	email!: string;

	@IsNotEmpty()
	password!: string;
}

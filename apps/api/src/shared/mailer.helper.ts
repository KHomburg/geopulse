//#region Import
import nodemailer from "nodemailer";
import { config } from "./config/env.config";
interface IMailer {
	from: string;
	to: string;
	subject: string;
	text: string;
	html: string;
}
//#endregion

/**
 * @name Mailer
 * @memberof Helpers
 * @description Function for sending email
 * @param req - Object passed by client
 * @param res - Object to be passed by server
 * @return Array
 */
const Mailer = async ({ from, to, subject, text, html }: IMailer) => {
	// Reusable transport object using default SMTP
	const transporter = nodemailer.createTransport({
		host: "smtp.gmail.com",
		port: 465,
		secure: true,
		auth: {
			user: `${config.MAILER_USER}`,
			pass: `${config.MAILER_PASSWORD}`
		}
	});

	await transporter.sendMail({
		from: `${from}`,
		to: `${to}`,
		subject: `${subject}`,
		text: `${text}`,
		html: `${html}`
	});
};

export const MailerHelper = {
	Mailer
};

import nodemailer from 'nodemailer'
require('dotenv').config()

const { GMAIL_MAIL, GMAIL_PASSWORD } = process.env

/**
 * Mailer
 * @param {*} to 
 * @param {*} subject 
 * @param {*} text 
 */
export function mailer(to, subject, text) {
    // Sementara menggunakan service email dari gmail
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: GMAIL_MAIL,
            pass: GMAIL_PASSWORD
        }
    })

    const mailOptions = {
        from: `SMARAK <${GMAIL_MAIL}>`,
        to: to,
        subject: subject,
        html: text
    }

    transporter.sendMail(mailOptions, function (err, info) {
        if (err) {
            console.error(err);
        }

        console.log(`Email sent: ${info.response}`);
    })
}
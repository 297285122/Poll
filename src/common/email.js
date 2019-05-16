import nodeEmailer from 'nodemailer';

class Email {
  constructor() {
    this.user = process.env.EMAIL_ADDRESS;
    this.transporter = nodeEmailer.createTransport({
      host: process.env.EMAIL_SMTP_HOST,
      port: process.env.EMAIL_SMTP_PORT,
      secure: true,
      auth: {
        user: this.user,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendMail({ to, subject, html }) {
    return new Promise((resolve, reject) => {
      this.transporter.sendMail({
        from: this.user, to, subject, html,
      }, (error, info) => {
        if (error) {
          return reject(error);
        }
        return resolve(null, info);
      });
    });
  }
}

const email = new Email();

export default email;

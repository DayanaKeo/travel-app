import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false, // true si 465
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
});

export function verificationEmailTemplate(url: string) {
  return `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.6">
      <h2>Confirme ton adresse e-mail</h2>
      <p>Merci de t’être inscrit sur TravelBook. Clique pour vérifier ton e-mail :</p>
      <p><a href="${url}" style="display:inline-block;padding:10px 16px;background:#111;color:#fff;border-radius:8px;text-decoration:none">Vérifier mon e-mail</a></p>
      <p>Ce lien expire dans 30 minutes.</p>
      <p>Si tu n’es pas à l’origine de cette action, ignore ce message.</p>
    </div>
  `;
}

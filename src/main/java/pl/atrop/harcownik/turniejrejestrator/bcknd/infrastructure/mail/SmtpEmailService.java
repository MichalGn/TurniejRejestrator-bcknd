package pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.mail;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.mail.Authenticator;
import jakarta.mail.Message;
import jakarta.mail.MessagingException;
import jakarta.mail.PasswordAuthentication;
import jakarta.mail.Session;
import jakarta.mail.Transport;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeBodyPart;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;
import jakarta.activation.DataHandler;
import jakarta.mail.util.ByteArrayDataSource;
import java.util.Properties;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.mail.EmailService;

/**
 *
 * @author Michał Gnatowski
 * @date 12 wrz 2025
 * @email michal.gnatowski@atrop.pl
 */
@ApplicationScoped
public class SmtpEmailService implements EmailService {

    @Override
    public void send(String to, String subject, String text) {
        //String user = System.getenv("SMTP_USER"); // e.g. rejestrator.turniejowy@gmail.com
        //String pass = System.getenv("SMTP_PASS"); // 16-char Gmail App Password


        String user = "rejestrator.turniejowy@gmail.com";
        String pass = "zfetpibqpcdxvzke";

        Properties p = new Properties();
        p.put("mail.smtp.host", "smtp.gmail.com");
        p.put("mail.smtp.port", "587");
        p.put("mail.smtp.auth", "true");
        p.put("mail.smtp.starttls.enable", "true");
        p.put("mail.smtp.ssl.protocols", "TLSv1.2"); // enforce modern TLS
        // Optional timeouts (ms)
        p.put("mail.smtp.connectiontimeout", "10000");
        p.put("mail.smtp.timeout", "10000");
        p.put("mail.smtp.writetimeout", "10000");

        Session s = Session.getInstance(p, new Authenticator() {
            @Override
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(user, pass);
            }
        });
        s.setDebug(true); // logs SMTP conversation

        try {
            Message m = new MimeMessage(s);
            m.setFrom(new InternetAddress(user)); // must match authenticated account or verified alias
            m.setRecipients(Message.RecipientType.TO, InternetAddress.parse(to, false));
            m.setSubject(subject);
            m.setText(text);
            Transport.send(m);
        } catch (MessagingException e) {
            e.printStackTrace(); // replace with proper logger
        }
    }
    @Override
    public void sendWithAttachment(String to, String subject, String text,
            byte[] attachment, String attachmentName, String contentType) {
        String user = "rejestrator.turniejowy@gmail.com";
        String pass = "zfetpibqpcdxvzke";

        Properties p = createMailProperties();
        Session s = createSession(p, user, pass);

        try {
            MimeMessage message = new MimeMessage(s);
            message.setFrom(new InternetAddress(user));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(to, false));
            message.setSubject(subject, "UTF-8");

            MimeBodyPart textPart = new MimeBodyPart();
            textPart.setText(text, "UTF-8");

            MimeBodyPart attachmentPart = new MimeBodyPart();
            ByteArrayDataSource dataSource = new ByteArrayDataSource(
                    attachment, contentType == null ? "application/pdf" : contentType);
            attachmentPart.setDataHandler(new DataHandler(dataSource));
            attachmentPart.setFileName(attachmentName);

            MimeMultipart multipart = new MimeMultipart();
            multipart.addBodyPart(textPart);
            multipart.addBodyPart(attachmentPart);
            message.setContent(multipart);

            Transport.send(message);
        } catch (MessagingException e) {
            throw new IllegalStateException("Nie udało się wysłać rachunku e-mailem.", e);
        }
    }

    private Properties createMailProperties() {
        Properties p = new Properties();
        p.put("mail.smtp.host", "smtp.gmail.com");
        p.put("mail.smtp.port", "587");
        p.put("mail.smtp.auth", "true");
        p.put("mail.smtp.starttls.enable", "true");
        p.put("mail.smtp.ssl.protocols", "TLSv1.2");
        p.put("mail.smtp.connectiontimeout", "10000");
        p.put("mail.smtp.timeout", "10000");
        p.put("mail.smtp.writetimeout", "10000");
        return p;
    }

    private Session createSession(Properties properties, String user, String pass) {
        Session session = Session.getInstance(properties, new Authenticator() {
            @Override
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(user, pass);
            }
        });
        session.setDebug(true);
        return session;
    }

}

package pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.mail;

import jakarta.activation.DataHandler;
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
import jakarta.mail.util.ByteArrayDataSource;
import java.util.Properties;
import java.util.logging.Level;
import java.util.logging.Logger;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.mail.EmailService;

/**
 * SMTP e-mail sender.
 *
 * Required environment variables:
 *   SMTP_USER - Gmail account used for sending
 *   SMTP_PASS - Gmail App Password (not the normal Google account password)
 *
 * Optional environment variable:
 *   SMTP_DEBUG - true to enable Jakarta Mail SMTP debug logging
 *
 * @author Michał Gnatowski
 * @date 12 wrz 2025
 * @email michal.gnatowski@atrop.pl
 */
@ApplicationScoped
public class SmtpEmailService implements EmailService {

    private static final Logger LOGGER = Logger.getLogger(SmtpEmailService.class.getName());
    private static final String SMTP_HOST = "smtp.gmail.com";
    private static final String SMTP_PORT = "587";

    @Override
    public void send(String to, String subject, String text) {
        SmtpCredentials credentials = readCredentials();
        Session session = createSession(createMailProperties(), credentials.user(), credentials.password());

        try {
            MimeMessage message = new MimeMessage(session);
            message.setFrom(new InternetAddress(credentials.user()));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(to, false));
            message.setSubject(subject, "UTF-8");
            message.setText(text, "UTF-8");

            Transport.send(message);
            LOGGER.log(Level.INFO, "E-mail sent successfully to {0}", to);
        } catch (MessagingException e) {
            LOGGER.log(Level.SEVERE, "SMTP error while sending e-mail to " + to, e);
            throw new IllegalStateException("Nie udało się wysłać wiadomości e-mail.", e);
        }
    }

    @Override
    public void sendWithAttachment(String to, String subject, String text,
            byte[] attachment, String attachmentName, String contentType) {
        SmtpCredentials credentials = readCredentials();
        Session session = createSession(createMailProperties(), credentials.user(), credentials.password());

        try {
            MimeMessage message = new MimeMessage(session);
            message.setFrom(new InternetAddress(credentials.user()));
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
            LOGGER.log(Level.INFO, "E-mail with attachment sent successfully to {0}", to);
        } catch (MessagingException e) {
            LOGGER.log(Level.SEVERE, "SMTP error while sending e-mail with attachment to " + to, e);
            throw new IllegalStateException("Nie udało się wysłać rachunku e-mailem.", e);
        }
    }

    private Properties createMailProperties() {
        Properties properties = new Properties();
        properties.put("mail.smtp.host", SMTP_HOST);
        properties.put("mail.smtp.port", SMTP_PORT);
        properties.put("mail.smtp.auth", "true");
        properties.put("mail.smtp.starttls.enable", "true");
        properties.put("mail.smtp.starttls.required", "true");
        properties.put("mail.smtp.ssl.protocols", "TLSv1.2");
        properties.put("mail.smtp.connectiontimeout", "10000");
        properties.put("mail.smtp.timeout", "10000");
        properties.put("mail.smtp.writetimeout", "10000");
        return properties;
    }

    private Session createSession(Properties properties, String user, String password) {
        Session session = Session.getInstance(properties, new Authenticator() {
            @Override
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(user, password);
            }
        });
        session.setDebug(Boolean.parseBoolean(System.getenv().getOrDefault("SMTP_DEBUG", "false")));
        return session;
    }

    private SmtpCredentials readCredentials() {
        String user = requiredEnvironmentVariable("SMTP_USER");
        // Google often displays App Passwords grouped with spaces; accept either form.
        String password = requiredEnvironmentVariable("SMTP_PASS").replace(" ", "");
        return new SmtpCredentials(user, password);
    }

    private String requiredEnvironmentVariable(String name) {
        String value = System.getenv(name);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(
                    "Brak wymaganej zmiennej środowiskowej " + name + " dla konfiguracji SMTP.");
        }
        return value.trim();
    }

    private record SmtpCredentials(String user, String password) {
    }
}

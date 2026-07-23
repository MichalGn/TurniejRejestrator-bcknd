package pl.atrop.harcownik.turniejrejestrator.bcknd.domain.mail;

/**
 *
 * @author Michał Gnatowski
 * @date 12 wrz 2025
 * @email michal.gnatowski@atrop.pl
 */

public interface EmailService {
    void send(String to, String subject, String text);
    default void sendAsync(String to, String subject, String text) { send(to, subject, text); }

    void sendWithAttachment(String to, String subject, String text,
            byte[] attachment, String attachmentName, String contentType);
}

package pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.gus;

public class GusBirException extends RuntimeException {

    public GusBirException(String message) {
        super(message);
    }

    public GusBirException(String message, Throwable cause) {
        super(message, cause);
    }
}

package pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.registration.dto;

/**
 * DTO used by public edit link. It has the same shape as the individual
 * registration form and additionally carries the registration UUID.
 */
public record IndividualRegisterEditDto(
    String uuid,
    String firstname,
    String lastname,
    Integer birthYear,
    String gender,
    String category,
    String games,
    boolean nightFriSat,
    boolean supperFri,
    boolean dinnerSat,
    boolean nightSatSun,
    boolean supperSat,
    boolean dinnerSun,
    String email,
    String repeatEmail,
    String city,
    String comment,
    int price
) {}

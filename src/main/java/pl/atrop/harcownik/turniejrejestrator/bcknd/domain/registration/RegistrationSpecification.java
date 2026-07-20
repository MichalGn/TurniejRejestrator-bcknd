package pl.atrop.harcownik.turniejrejestrator.bcknd.domain.registration;

import java.math.BigDecimal;
import java.util.List;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.registration.RegistrationResource.RegistrationStatus;

/**
 *
 * @author Michał Gnatowski
 * @date 7 wrz 2025
 * @email michal.gnatowski@atrop.pl
 */

public record RegistrationSpecification(
    long registrationId,
    String uuid,
    String clubName,
    String nip,
    String streetNo,
    String zipCode,
    String city,
    String registratorName,
    String email,
    String phone,
    BigDecimal totalPrice,
    RegistrationStatus status,
    List<CoachSpecification> coaches,
    List<PlayerSpecification> players,
    List<StatusSpecification> statuses

) {}

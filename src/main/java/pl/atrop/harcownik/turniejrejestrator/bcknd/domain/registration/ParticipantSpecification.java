package pl.atrop.harcownik.turniejrejestrator.bcknd.domain.registration;

/**
 *
 * @author Michał Gnatowski
 * @date 16 wrz 2025
 * @email michal.gnatowski@atrop.pl
 */

public record ParticipantSpecification(
        String clubName,
        PlayerSpecification playerSpec,
        boolean dinnerSat
        ) {

}

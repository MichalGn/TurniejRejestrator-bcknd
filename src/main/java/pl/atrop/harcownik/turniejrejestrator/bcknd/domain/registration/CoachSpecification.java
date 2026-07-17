package pl.atrop.harcownik.turniejrejestrator.bcknd.domain.registration;

/**
 *
 * @author Michał Gnatowski
 * @date 7 wrz 2025
 * @email michal.gnatowski@atrop.pl
 */
public record CoachSpecification(
    PersonSpecification personSpec,
    boolean dinnerSat
    ) {
}

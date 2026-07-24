package pl.atrop.harcownik.turniejrejestrator.bcknd.domain.registration;

/**
 *
 * @author Michał Gnatowski
 * @date 7 wrz 2025
 * @email michal.gnatowski@atrop.pl
 */

public record PlayerSpecification (
        PersonSpecification personSpec,
        Integer birthYear,
        String category,
        Integer games,
        boolean dinnerSat
        ){
}

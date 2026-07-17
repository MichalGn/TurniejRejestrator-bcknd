package pl.atrop.harcownik.turniejrejestrator.bcknd.domain.registration;

import java.math.BigDecimal;

/**
 *
 * @author Michał Gnatowski
 * @date 7 wrz 2025
 * @email michal.gnatowski@atrop.pl
 */

public record PersonSpecification(
        String firstname,
        String lastname,
        String gender,
        boolean supperFri,
        boolean nightFriSat,
        boolean supperSat,
        boolean nightSatSun,
        boolean dinnerSun,
        BigDecimal price
        ) {

}

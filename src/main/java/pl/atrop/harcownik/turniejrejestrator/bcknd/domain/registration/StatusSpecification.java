package pl.atrop.harcownik.turniejrejestrator.bcknd.domain.registration;

import java.time.LocalDateTime;

/**
 *
 * @author Michał Gnatowski
 * @date 8 wrz 2025
 * @email michal.gnatowski@atrop.pl
 */
public record StatusSpecification(
        LocalDateTime datetime,
        String status,
        String comment
        ) {

}

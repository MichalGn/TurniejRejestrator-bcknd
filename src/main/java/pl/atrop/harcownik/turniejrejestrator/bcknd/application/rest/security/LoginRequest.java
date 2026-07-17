package pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.security;

/**
 *
 * @author Michał Gnatowski
 * @email michal.gnatowski@atrop.pl
 * @date 14 lut 2022 05:16:08
 */
public record LoginRequest(
        String username,
         String password) {
}


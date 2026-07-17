package pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.configuration.user.dto;

/**
 *
 * @author Michał Gnatowski
 * @date 10 sie 2025
 * @email michal.gnatowski@atrop.pl
 */

public record ChangePasswordDto(
        String oldPassword
        ,String newPassword
        ) {

}

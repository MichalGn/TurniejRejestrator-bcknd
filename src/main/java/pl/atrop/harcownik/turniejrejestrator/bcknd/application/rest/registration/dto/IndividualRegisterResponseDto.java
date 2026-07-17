package pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.registration.dto;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
/**
 *
 * @author Michał Gnatowski
 * @date 23 sie 2025
 * @email michal.gnatowski@atrop.pl
 */

@JsonInclude(Include.NON_NULL)
public record IndividualRegisterResponseDto(
    long id,
    String status,     // e.g. "accepted"
    String message     // optional extra info
) {}
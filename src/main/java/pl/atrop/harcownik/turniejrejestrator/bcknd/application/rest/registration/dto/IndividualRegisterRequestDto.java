package pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.registration.dto;
//import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.*;

/**
 *
 * @author Michał Gnatowski
 * @date 23 sie 2025
 * @email michal.gnatowski@atrop.pl
 */

//@JsonInclude(JsonInclude.Include.NON_NULL)
public record IndividualRegisterRequestDto(
    @NotBlank String firstname,
    @NotBlank String lastname,
    Integer birthYear,
    
    @NotNull  String gender,
    @NotNull  String category,
    @NotNull  String games,

    boolean nightFriSat,
    boolean supperFri,
    boolean dinnerSat,
    boolean nightSatSun,
    boolean supperSat,
    boolean dinnerSun,

    @NotBlank @Email String email,
    @NotBlank @Email String repeatEmail,
    @NotBlank String city,

    @Size(max = 500) String comment,   // ← OPTIONAL

    @Min(0) int price
) {
    public IndividualRegisterRequestDto {
        if (gender != null)       gender       = gender.trim();
        if (category != null)     category     = category.trim();
        if (games != null)        games        = games.trim();
        if (email != null)        email        = email.trim();
        if (repeatEmail != null)  repeatEmail  = repeatEmail.trim();
        if (comment != null) {
            comment = comment.trim();
            if (comment.isEmpty()) comment = null; // normalize empty → null
        }
    }
}
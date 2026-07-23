package pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.registration.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

public record ClubRegisterRequestDto(
        @Valid ClubInfo club,
        @Valid List<PersonData> coaches,
        @Valid List<PlayerData> players,
        @Valid ContactInfo contact,
        @Size(max = 500) String comment,
        @Valid Totals totals
) {
    public record ClubInfo(
            @Size(max = 200) String name,
            String nip,
            @Size(max = 120) String streetNo,
            @Size(max = 16) String zip_code,
            @Size(max = 120) String city
    ) {}

    public record ContactInfo(
            @Size(max = 200) String fullName,
            @NotBlank @Email String email,
            @NotBlank @Email String repeatEmail,
            @Pattern(regexp = "^$|^\\+?\\d[\\d\\s\\-()]{5,}$")
            String phone
    ) {}

    /** For coaches (matches your current JSON for coaches) */
    public record PersonData(
            @Size(max = 120) String firstname,
            @Size(max = 120) String lastname,
            String gender,
            boolean supperFri,
            boolean nightFriSat,
            Boolean dinnerSat,
            boolean supperSat,
            boolean nightSatSun,
            boolean dinnerSun,
            Integer fee
    ) {}

    /** For players: flat fields + category + games as String ("1g"/"2g") */
    public record PlayerData(
            @Size(max = 120) String firstname,
            @Size(max = 120) String lastname,
            Integer birthYear,
            String gender,
            boolean supperFri,
            boolean nightFriSat,
            Boolean dinnerSat,
            boolean supperSat,
            boolean nightSatSun,
            boolean dinnerSun,
            Integer fee,
            @NotNull Category category,   // frontend must send "KT"/"GP"
            @NotNull String games         // frontend sends "1g" or "2g"
    ) {}

    public record Totals(
            Integer coachesTotalPrice,
            Integer playersTotalPrice,
            Integer grandTotal
    ) {}


    public enum Category { KT, GP }
}

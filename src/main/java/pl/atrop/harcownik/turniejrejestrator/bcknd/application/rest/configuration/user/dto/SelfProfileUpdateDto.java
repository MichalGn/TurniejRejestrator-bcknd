package pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.configuration.user.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.Size;

@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public record SelfProfileUpdateDto(
        Integer id,                 // from payload; validated against auth user
        String username,            // optional; usually read-only on server
        @Size(min = 3, max = 64) String firstname,
        @Size(min = 2, max = 64) String lastname,

        // password change block
        Boolean changePassword,     // if true -> oldPassword + newPassword required
        String oldPassword,         // BASE64 of hex/md5? (see service below)
        String newPassword,         // BASE64 of hex/md5? (see service below)

        String datetime             // client “last-modified”; parsed by TimeConverter
) {
    public SelfProfileUpdateDto {
        if (firstname != null) firstname = firstname.trim();
        if (lastname  != null) lastname  = lastname.trim();
        if (username  != null) username  = username.trim();
        // passwords + datetime left as-is
    }
}

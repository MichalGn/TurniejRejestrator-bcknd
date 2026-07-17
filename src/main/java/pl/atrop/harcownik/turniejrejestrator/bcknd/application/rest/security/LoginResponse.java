package pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.security;

import jakarta.json.JsonArrayBuilder;
import jakarta.json.JsonObject;
import jakarta.json.JsonObjectBuilder;
import jakarta.json.spi.JsonProvider;
import java.util.Optional;
//import pl.atrop.technius.bcknd.domain.configuration.user.UserSpecification;

/**
 *
 * @author Michał Gnatowski
 * @email michal.gnatowski@atrop.pl
 * @date 14 lut 2022 05:32:51
 * na podst. https://simplesolution.dev/java-json-web-token-using-java-jwt-library/
 */

public class LoginResponse {
    
    public LoginResponse() {}
    
    public static LoginResponse get() {return new LoginResponse();}
/*............TODO........
    public JsonObject toJsonObject(UserSpecification userSpecification, String accessToken) {
        JsonProvider provider = JsonProvider.provider();
        JsonObjectBuilder job = provider.createObjectBuilder();
        job.add("id", userSpecification.id());
        job.add("username", userSpecification.username());
        Optional.ofNullable(userSpecification.firstname()).ifPresent(fn->{job.add("firstname", fn);});
        Optional.ofNullable(userSpecification.lastname()).ifPresent(ln->{job.add("lastname", ln);});
        job.add("accessToken", accessToken);

        JsonArrayBuilder jab = provider.createArrayBuilder();
        userSpecification.roleNames().stream().forEach(r -> {
            jab.add(r);
        });

        job.add("roles", jab);
        return job.build();
    }
    */
    public JsonObject accessTokenOnlytoJsonObject(String accessToken) {
        JsonProvider provider = JsonProvider.provider();
        JsonObjectBuilder job = provider.createObjectBuilder();
        job.add("accessToken", accessToken);
        return job.build();
    }
    
    public JsonObject toJsonObjectUnauthorized() {
        JsonProvider provider = JsonProvider.provider();
        JsonObjectBuilder job = provider.createObjectBuilder();
        job.add("message", "Błędne logowanie");
        return job.build();
    }
    
}

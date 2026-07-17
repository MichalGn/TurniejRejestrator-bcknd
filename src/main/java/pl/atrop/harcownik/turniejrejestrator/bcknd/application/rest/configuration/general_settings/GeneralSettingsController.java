package pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.configuration.general_settings;

import jakarta.inject.Inject;
import jakarta.json.Json;
import jakarta.json.JsonObject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.security.interceptors.TokenVeryfier;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.configuration.general_settings.GeneralSettingSpecification;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.configuration.general_settings.GeneralSettingsService;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.interceptors.SeparatorLogLine;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.interceptors.Timed;

/**
 *
 * @author Michał Gnatowski
 * @date 14 sie 2025
 * @email michal.gnatowski@atrop.pl
 */
@Path("general-settings")
@SeparatorLogLine
@Timed
@TokenVeryfier
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class GeneralSettingsController {

    private final GeneralSettingsService service;

    public GeneralSettingsController() {
        this.service = null;
    }

    @Inject
    public GeneralSettingsController(GeneralSettingsService service) {
        this.service = service;
    }

    @GET
    @Path("")
    public Response findAll(@HeaderParam("Authorization") String authToken) {
        if (authToken == null || !authToken.startsWith(Boolean.TRUE.toString())) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        List<GeneralSettingSpecification> names = service.findAll();
        Map<String, Object> responseMap = new HashMap<>();
        responseMap.put("data", names);
        if (!Boolean.TRUE.toString().equals(authToken)) {
            responseMap.put("newAccessToken", authToken.replaceFirst(Boolean.TRUE.toString(), ""));
        }
        return Response.ok(responseMap).build();
    }

    @GET
    @Path("findByKey1")
    public Response findByKey1(
            @HeaderParam("Authorization") String authToken,
            @QueryParam("key1") String key1) {
//        if (authToken == null || !authToken.startsWith(Boolean.TRUE.toString())) {
//            return Response.status(Response.Status.UNAUTHORIZED).build();
//        }
        GeneralSettingSpecification spec = service.findByKey1(key1);
        Map<String, Object> responseMap = new HashMap<>();
        responseMap.put("data", spec.value1());
        return Response.ok(responseMap).build();
    }

    @POST
    @Path("")
    public Response create(@HeaderParam("Authorization") String authToken, JsonObject request
    ) {
        if (authToken == null || !authToken.startsWith(Boolean.TRUE.toString())) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        String key1 = request.getString("key1", null);
        String value1 = request.getString("value1", null);

        if (key1 == null || key1.isBlank() || value1 == null || value1.isBlank()) {
            JsonObject err = Json.createObjectBuilder()
                    .add("error", "Both 'label' and 'value' are required.")
                    .build();
        }

        try {
            service.createOrModify(key1, value1);
            return authToken.equals(Boolean.TRUE.toString())
                    ? Response.status(Response.Status.CREATED).build()
                    : Response.status(Response.Status.CREATED).entity(Map.of("newAccessToken", authToken.replaceFirst(Boolean.TRUE.toString(), ""))).build();

        } catch (Exception exc) {
            return Response.status(Response.Status.CONFLICT)
                    .build();
        }
    }
}

package pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.configuration.user;

import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.configuration.user.dto.CreateUserDto;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.configuration.user.dto.SelfProfileUpdateDto;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.configuration.user.dto.UpdateUserDto;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.security.interceptors.TokenVeryfier;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.configuration.user.UserService;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.configuration.user.UserSpecification;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.interceptors.SeparatorLogLine;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.interceptors.Timed;

/**
 *
 * @author Michał Gnatowski
 * @date 9 sie 2025
 * @email michal.gnatowski@atrop.pl
 */
@Path("users")
@SeparatorLogLine
@Timed
@TokenVeryfier
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UserController {

    private final UserService service;

    public UserController() {
        this.service = null;
    }

    @Inject
    public UserController(UserService service) {
        this.service = service;
    }

    @GET
    @Path("usernames")
    public Response findUsernames(@HeaderParam("Authorization") String authToken) {
        if (authToken == null || !authToken.startsWith(Boolean.TRUE.toString())) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        List<String> names = service.findUsernames();
        Map<String, Object> responseMap = new HashMap<>();
        responseMap.put("data", names);
        if (!Boolean.TRUE.toString().equals(authToken)) {
            responseMap.put("newAccessToken", authToken.replaceFirst(Boolean.TRUE.toString(), ""));
        }
        return Response.ok(responseMap).build();
    }

    @PUT
    @Path("selfuser")
    //public Response modifySelfuser(@HeaderParam("Authorization") String authToken,  @Valid SelfProfileUpdateDto request) {
    public Response modifySelfuser(@HeaderParam("Authorization") String authToken, SelfProfileUpdateDto request) {
        System.out.println("mS, aaa");
        System.out.println("mS, bbb, request:" + request);
        if (authToken == null || !authToken.startsWith(Boolean.TRUE.toString())) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        System.out.println("mS, ccc");

        try {
            service.modifySelfuser(request);
            return authToken.equals(Boolean.TRUE.toString())
                    ? Response.status(Response.Status.CREATED).build()
                    : Response.status(Response.Status.CREATED)
                            .entity(Map.of("newAccessToken", authToken.replaceFirst(Boolean.TRUE.toString(), "")))
                            .build();

        } catch (Exception exc) {
            String msg = Optional.ofNullable(exc.getMessage()).orElse("Unknown error");
            return Response.status(Response.Status.CONFLICT).entity(Map.of("message", msg)).build();
        }
    }

//    @PUT
//    @Path("selfuser")
//    public Response modifySelfuser(@HeaderParam("Authorization") String authToken, SelfModifyDto request) {
//
//        if (authToken == null || !authToken.startsWith(Boolean.TRUE.toString())) {
//            return Response.status(Response.Status.UNAUTHORIZED).build();
//        }
//
//        try {
//            service.modifySelfuser(request);
//            return authToken.equals(Boolean.TRUE.toString())
//                    ? Response.status(Response.Status.CREATED).build()
//                    : Response.status(Response.Status.CREATED).entity(Map.of("newAccessToken", authToken.replaceFirst(Boolean.TRUE.toString(), ""))).build();
//
//        } catch (Exception exc) {
//            String errorMessage = Optional.ofNullable(exc.getMessage())
//                    .map(msg -> msg.contains(":") ? msg.substring(msg.indexOf(":") + 1).trim() : msg)
//                    .orElse("Unknown error");
//
//            return Response.status(Response.Status.CONFLICT)
//                    .entity(Map.of("message", errorMessage))
//                    .build();
//        }
//    }

    @GET
    @Path("")
    public Response findAll(@HeaderParam("Authorization") String authToken, @QueryParam("activeOnly") boolean activeOnly) {
        if (authToken == null || !authToken.startsWith(Boolean.TRUE.toString())) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        List<UserSpecification> specs = service.findAll(activeOnly);
        Map<String, Object> responseMap = new HashMap<>();
        responseMap.put("data", specs);

        if (!Boolean.TRUE.toString().equals(authToken)) {
            responseMap.put("newAccessToken", authToken.replaceFirst(Boolean.TRUE.toString(), ""));
        }
        return Response.ok(responseMap).build();
    }

    @POST
    @Path("")
    public Response create(@HeaderParam("Authorization") String authToken, CreateUserDto request) {
        if (authToken == null || !authToken.startsWith(Boolean.TRUE.toString())) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        System.out.println("aaaaaaaaaaa, request:" + request);

        UserSpecification spec = new UserSpecification(
                null, request.username(),
                request.firstname(), request.lastname(),
                request.password(),
                request.admin(), false);

        try {
            service.createOrModify(spec);
            return authToken.equals(Boolean.TRUE.toString())
                    ? Response.status(Response.Status.CREATED).build()
                    : Response.status(Response.Status.CREATED).entity(Map.of("newAccessToken", authToken.replaceFirst(Boolean.TRUE.toString(), ""))).build();

        } catch (Exception exc) {
            return Response.status(Response.Status.CONFLICT)
                    .build();
        }
    }

    @PUT
    @Path("")
    public Response modify(@HeaderParam("Authorization") String authToken, UpdateUserDto request) {
        if (authToken == null || !authToken.startsWith(Boolean.TRUE.toString())) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        UserSpecification spec = new UserSpecification(
                request.id(), request.username(),
                request.firstname(), request.lastname(),
                request.password(),
                request.admin(), request.active());

        try {
            service.createOrModify(spec);
            return authToken.equals(Boolean.TRUE.toString())
                    ? Response.status(Response.Status.CREATED).build()
                    : Response.status(Response.Status.CREATED).entity(Map.of("newAccessToken", authToken.replaceFirst(Boolean.TRUE.toString(), ""))).build();

        } catch (Exception exc) {
            return Response.status(Response.Status.CONFLICT)
                    .build();
        }
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@HeaderParam("Authorization") String authToken, @PathParam("id") int productId) {
        if (authToken == null || !authToken.startsWith(Boolean.TRUE.toString())) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity(Map.of("error", "Invalid or missing authentication token"))
                    .build();
        }

        try {
            service.delete(productId);
            Response.ResponseBuilder responseBuilder = Response.ok();
            if (!Boolean.TRUE.toString().equals(authToken)) {
                responseBuilder.entity(Map.of("newAccessToken", authToken.replaceFirst(Boolean.TRUE.toString(), "")));
            }
            return responseBuilder.build();

        } catch (Exception exc) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "An unexpected error occurred while deleting the product " + exc.getMessage()))
                    .build();
        }
    }
}

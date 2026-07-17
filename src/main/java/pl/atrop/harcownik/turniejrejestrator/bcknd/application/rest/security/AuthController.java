package pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.security;

import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.configuration.user.UserService;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.configuration.user.UserSpecification;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.interceptors.SeparatorLogLine;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.interceptors.Timed;


/**
 *
 * @author Michał Gnatowski
 * @email michal.gnatowski@atrop.pl
 * @date 13 lut 2022 22:05:02
 *
 * W odpowiedzi dodać w headerze: header('Access-Control-Allow-Origin: *');
 * swagger:
 * https://github.com/swagger-api/swagger-core/wiki/Swagger-2.X---Getting-started
 */
@Path("/auth")
@SeparatorLogLine
@Timed
//@TokenVeryfier
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthController {

    private static final Logger LOGGER = LoggerFactory.getLogger(AuthController.class);

    private final TokenService tokenService;
    private final UserService userService;

    public AuthController() {
        this.tokenService = null;
        this.userService = null;
    }

    @Inject
    public AuthController(TokenService tokenService, UserService userService) {
        this.tokenService = tokenService;
        this.userService = userService;
    }

    @GET
    @Path("/hello")
    public String sayHello() {  //test: http://localhost:8080/TurniejRejestrator-bcknd/api/auth/hello
//        ILoggerFactory logFac = LoggerFactory.getILoggerFactory();
        LOGGER.info("sayHello");
        return "TurniejRejestrator- Hello World";
    }

    @POST
    @Path("/signinTest")
    public Response signin() {
        return Response.ok().build();
    }

    //nie działa ta linika (curl). Chyba powinno być https zamiast http    curl -X POST http://localhost:8080/api/auth/signin -H 'Content-Type: application/json' -d '{"username":"aaa","password":"my_password"}'
    @POST
    @Path("/signin")
    public Response signin(LoginRequest request) {
        UserSpecification userSpecification = userService.getByUsernameAndPassword(request.username(), request.password());
        if (Optional.ofNullable(userSpecification).isPresent()) {
            //String accessToken = tokenService.generateToken(userSpecification.username(), userSpecification.roleNames());
            String accessToken = tokenService.generateToken(userSpecification.username(), List.of("admin"));
            Map<String, Object> responseMap = Map.of("data", userSpecification, "accessToken", accessToken);
            return Response.ok(responseMap).build();
        } else {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
    }
}

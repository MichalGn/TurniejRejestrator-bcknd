package pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.registration;

import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DefaultValue;
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
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.registration.dto.ClubRegisterRequestDto;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.registration.dto.IndividualRegisterRequestDto;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.registration.dto.IndividualRegisterEditDto;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.registration.dto.IndividualRegisterResponseDto;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.security.interceptors.TokenVeryfier;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.interceptors.SeparatorLogLine;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.interceptors.Timed;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.registration.RegistrationService;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.registration.RegistrationSpecification;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.registration.ParticipantSpecification;

/**
 *
 * @author Michał Gnatowski
 * @date 23 sie 2025
 * @email michal.gnatowski@atrop.pl
 */
@Path("register")
@SeparatorLogLine
@Timed
@TokenVeryfier
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class RegistrationResource {

    private final RegistrationService service;

    public RegistrationResource() {
        this.service = null;
    }

    @Inject
    public RegistrationResource(RegistrationService service) {
        this.service = service;
    }

    @GET
    @Path("emails")
    public Response findEmails(@HeaderParam("Authorization") String authToken) {
        List<String> emails = service.findEmails();
        Map<String, Object> responseMap = new HashMap<>();
        responseMap.put("data", emails);

        return Response.ok(responseMap).build();
    }

    @POST
    @Path("/individual")
    public Response saveIndividual(@HeaderParam("Authorization") String authToken, @Valid IndividualRegisterRequestDto request) {

        if (service.isRegistrationClosed()) {
            return registrationClosed();
        }
        if (request == null) {
            return badRequest("emptyBody");
        }

        // Required fields (server-side guard)
        if (isBlank(request.gender()) || isBlank(request.category()) || isBlank(request.games())) {
            return badRequest("gender_category_games_required");
        }

        // Emails must match
        if (!Objects.equals(request.email(), request.repeatEmail())) {
            return badRequest("emailMismatch");
        }
        if (emailAlreadyRegistered(request.email())) {
            return duplicateEmail();
        }

        long id = service.saveIndividual(request);
        return Response.status(Response.Status.CREATED)
                .entity(new IndividualRegisterResponseDto(id, "accepted", null))
                .build();
    }


    @GET
    @Path("/individual/{uuid}")
    public Response findIndividualByUuid(@HeaderParam("Authorization") String authToken, @PathParam("uuid") String uuid) {
        if (isBlank(uuid)) {
            return badRequest("invalid_uuid");
        }

        IndividualRegisterEditDto item = service.findIndividualByUuid(uuid);
        if (item == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "not_found"))
                    .build();
        }
        return Response.ok(item).build();
    }

    @PUT
    @Path("/individual/{uuid}")
    public Response updateIndividualByUuid(
            @HeaderParam("Authorization") String authToken,
            @PathParam("uuid") String uuid,
            @Valid IndividualRegisterRequestDto request) {

        if (isBlank(uuid)) {
            return badRequest("invalid_uuid");
        }
        if (service.isRegistrationClosed()) {
            return registrationClosed();
        }
        if (request == null) {
            return badRequest("emptyBody");
        }
        if (isBlank(request.gender()) || isBlank(request.category()) || isBlank(request.games())) {
            return badRequest("gender_category_games_required");
        }
        if (!Objects.equals(request.email(), request.repeatEmail())) {
            return badRequest("emailMismatch");
        }

        try {
            service.updateIndividualByUuid(uuid, request);
            return Response.ok(Map.of("status", "updated")).build();
        } catch (IllegalArgumentException ex) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "not_found"))
                    .build();
        } catch (Exception ex) {
            return Response.status(Response.Status.CONFLICT)
                    .entity(Map.of("error", "update_failed", "message", ex.getMessage()))
                    .build();
        }
    }

    @DELETE
    @Path("/individual/{uuid}")
    public Response removeIndividualByUuid(@HeaderParam("Authorization") String authToken, @PathParam("uuid") String uuid) {
        if (isBlank(uuid)) {
            return badRequest("invalid_uuid");
        }
        if (service.isRegistrationClosed()) {
            return registrationClosed();
        }

        try {
            service.removeIndividualByUuid(uuid);
            return Response.ok(Map.of("status", "removed")).build();
        } catch (IllegalArgumentException ex) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "not_found"))
                    .build();
        } catch (Exception ex) {
            return Response.status(Response.Status.CONFLICT)
                    .entity(Map.of("error", "remove_failed", "message", ex.getMessage()))
                    .build();
        }
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank(); // Java 11+: trims and checks emptiness
    }

    private static Response badRequest(String code) {
        return Response.status(Response.Status.BAD_REQUEST).entity(Map.of("error", code)).build();
    }

    private static Response registrationClosed() {
        return Response.status(Response.Status.FORBIDDEN)
                .entity(Map.of("error", "registration_closed"))
                .build();
    }

    private static Response duplicateEmail() {
        return Response.status(Response.Status.CONFLICT)
                .entity(Map.of("error", "email_already_registered"))
                .build();
    }

    private boolean emailAlreadyRegistered(String email) {
        if (isBlank(email)) {
            return false;
        }
        String normalized = email.trim();
        return service.findEmails().stream()
                .filter(Objects::nonNull)
                .anyMatch(existing -> existing.trim().equalsIgnoreCase(normalized));
    }

    private static Response validateClubRequest(ClubRegisterRequestDto request) {
        Response commonError = validateGroupRequest(request);
        if (commonError != null) {
            return commonError;
        }
        if (request.club() == null || isBlank(request.club().name())) {
            return badRequest("club_name_required");
        }
        return null;
    }

    private static Response validateFamilyRequest(ClubRegisterRequestDto request) {
        Response commonError = validateGroupRequest(request);
        if (commonError != null) {
            return commonError;
        }
        int coaches = request.coaches() == null ? 0 : request.coaches().size();
        int players = request.players() == null ? 0 : request.players().size();
        if (coaches + players == 0) {
            return badRequest("family_members_required");
        }
        return null;
    }

    private static Response validateGroupRequest(ClubRegisterRequestDto request) {
        if (request == null) {
            return badRequest("emptyBody");
        }
        if (request.contact() == null || isBlank(request.contact().email())) {
            return badRequest("contact_email_required");
        }
        if (!Objects.equals(request.contact().email(), request.contact().repeatEmail())) {
            return badRequest("emailMismatch");
        }

        int coachesSum = request.coaches() == null ? 0
                : request.coaches().stream().mapToInt(c -> c.fee() == null ? 0 : c.fee()).sum();
        int playersSum = request.players() == null ? 0
                : request.players().stream().mapToInt(p -> p.fee() == null ? 0 : p.fee()).sum();
        int grand = coachesSum + playersSum;

        if (request.totals() != null) {
            if (!Objects.equals(request.totals().coachesTotalPrice(), coachesSum)) {
                return badRequest("totals_mismatch_coaches");
            }
            if (!Objects.equals(request.totals().playersTotalPrice(), playersSum)) {
                return badRequest("totals_mismatch_players");
            }
            if (!Objects.equals(request.totals().grandTotal(), grand)) {
                return badRequest("totals_mismatch_grand");
            }
        }
        return null;
    }

    @GET
    @Path("/club/{uuid}")
    public Response findClubByUuid(@HeaderParam("Authorization") String authToken, @PathParam("uuid") String uuid) {
        if (isBlank(uuid)) {
            return badRequest("invalid_uuid");
        }

        ClubRegisterRequestDto item = service.findClubByUuid(uuid);
        if (item == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "not_found_or_removed"))
                    .build();
        }
        return Response.ok(item).build();
    }

    @PUT
    @Path("/club/{uuid}")
    public Response updateClubByUuid(
            @HeaderParam("Authorization") String authToken,
            @PathParam("uuid") String uuid,
            @Valid ClubRegisterRequestDto request) {

        if (isBlank(uuid)) {
            return badRequest("invalid_uuid");
        }
        if (service.isRegistrationClosed()) {
            return registrationClosed();
        }
        Response validationError = validateClubRequest(request);
        if (validationError != null) {
            return validationError;
        }

        try {
            service.updateClubByUuid(uuid, request);
            return Response.ok(Map.of("status", "updated")).build();
        } catch (IllegalArgumentException ex) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "not_found_or_removed"))
                    .build();
        } catch (Exception ex) {
            return Response.status(Response.Status.CONFLICT)
                    .entity(Map.of("error", "update_failed", "message", ex.getMessage()))
                    .build();
        }
    }

    @DELETE
    @Path("/club/{uuid}")
    public Response removeClubByUuid(@HeaderParam("Authorization") String authToken, @PathParam("uuid") String uuid) {
        if (isBlank(uuid)) {
            return badRequest("invalid_uuid");
        }
        if (service.isRegistrationClosed()) {
            return registrationClosed();
        }

        try {
            service.removeClubByUuid(uuid);
            return Response.ok(Map.of("status", "removed")).build();
        } catch (IllegalArgumentException ex) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "not_found_or_removed"))
                    .build();
        } catch (Exception ex) {
            return Response.status(Response.Status.CONFLICT)
                    .entity(Map.of("error", "remove_failed", "message", ex.getMessage()))
                    .build();
        }
    }

    @POST
    @Path("/club")
    public Response saveClubRegistration(
            @HeaderParam("Authorization") String authToken,
            @Valid ClubRegisterRequestDto request) {

        if (service.isRegistrationClosed()) {
            return registrationClosed();
        }
        Response validationError = validateClubRequest(request);
        if (validationError != null) {
            return validationError;
        }
        if (emailAlreadyRegistered(request.contact().email())) {
            return duplicateEmail();
        }

        long id = service.saveClubRegistration(request);
        return Response.status(Response.Status.CREATED)
                .entity(Map.of("id", id, "status", "accepted"))
                .build();
    }

    @GET
    @Path("/family/{uuid}")
    public Response findFamilyByUuid(@HeaderParam("Authorization") String authToken, @PathParam("uuid") String uuid) {
        if (isBlank(uuid)) {
            return badRequest("invalid_uuid");
        }

        ClubRegisterRequestDto item = service.findFamilyByUuid(uuid);
        if (item == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "not_found_or_removed"))
                    .build();
        }
        return Response.ok(item).build();
    }

    @PUT
    @Path("/family/{uuid}")
    public Response updateFamilyByUuid(
            @HeaderParam("Authorization") String authToken,
            @PathParam("uuid") String uuid,
            @Valid ClubRegisterRequestDto request) {

        if (isBlank(uuid)) {
            return badRequest("invalid_uuid");
        }
        if (service.isRegistrationClosed()) {
            return registrationClosed();
        }
        Response validationError = validateFamilyRequest(request);
        if (validationError != null) {
            return validationError;
        }

        try {
            service.updateFamilyByUuid(uuid, request);
            return Response.ok(Map.of("status", "updated")).build();
        } catch (IllegalArgumentException ex) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "not_found_or_removed"))
                    .build();
        } catch (Exception ex) {
            return Response.status(Response.Status.CONFLICT)
                    .entity(Map.of("error", "update_failed", "message", ex.getMessage()))
                    .build();
        }
    }

    @DELETE
    @Path("/family/{uuid}")
    public Response removeFamilyByUuid(@HeaderParam("Authorization") String authToken, @PathParam("uuid") String uuid) {
        if (isBlank(uuid)) {
            return badRequest("invalid_uuid");
        }
        if (service.isRegistrationClosed()) {
            return registrationClosed();
        }

        try {
            service.removeFamilyByUuid(uuid);
            return Response.ok(Map.of("status", "removed")).build();
        } catch (IllegalArgumentException ex) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "not_found_or_removed"))
                    .build();
        } catch (Exception ex) {
            return Response.status(Response.Status.CONFLICT)
                    .entity(Map.of("error", "remove_failed", "message", ex.getMessage()))
                    .build();
        }
    }

    @POST
    @Path("/family")
    public Response saveFamilyRegistration(
            @HeaderParam("Authorization") String authToken,
            @Valid ClubRegisterRequestDto request) {

        if (service.isRegistrationClosed()) {
            return registrationClosed();
        }
        Response validationError = validateFamilyRequest(request);
        if (validationError != null) {
            return validationError;
        }
        if (emailAlreadyRegistered(request.contact().email())) {
            return duplicateEmail();
        }

        long id = service.saveFamilyRegistration(request);
        return Response.status(Response.Status.CREATED)
                .entity(Map.of("id", id, "status", "accepted"))
                .build();
    }

    @GET
    public Response findByStatus(
            @HeaderParam("Authorization") String authToken,
            @QueryParam("status") @DefaultValue("unverified") String status) {

        if (authToken == null || !authToken.startsWith(Boolean.TRUE.toString())) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        RegistrationStatus normalized = normalizeStatus(status);
        if (normalized == null) {
            return badRequest("invalid_status");
        }

        // Fetch a unified list of summaries to keep FE simple
        List<RegistrationSpecification> items = service.findListByStatus(normalized);

        Map<String, Object> response = new HashMap<>();
        response.put("status", normalized.name().toLowerCase());
        response.put("count", items.size());
        response.put("items", items);

        return Response.ok(response).build();
    }

    @PUT
    @Path("/{registrationId}")
    public Response updateStatus(
            @HeaderParam("Authorization") String authToken,
            @PathParam("registrationId") int registrationId,
            @QueryParam("status") String status) {
        if (authToken == null || !authToken.startsWith(Boolean.TRUE.toString())) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        try {
            RegistrationStatus registrationStatus = RegistrationStatus.getByName(status);
            service.updateStatus(registrationId, registrationStatus);
            return authToken.equals(Boolean.TRUE.toString())
                    ? Response.status(Response.Status.CREATED).build()
                    : Response.status(Response.Status.CREATED).entity(Map.of("newAccessToken", authToken.replaceFirst(Boolean.TRUE.toString(), ""))).build();

        } catch (Exception exc) {
            return Response.status(Response.Status.CONFLICT)
                    .build();
        }
    }

    @GET
    @Path("all")
    public Response findAll(@HeaderParam("Authorization") String authToken) {
        List<ParticipantSpecification> items = service.findAll();
        Map<String, Object> responseMap = new HashMap<>();
        responseMap.put("data", items);

        return Response.ok(responseMap).build();
    }


    @DELETE
    @Path("all")
    public Response deleteAll(@HeaderParam("Authorization") String authToken) {
        if (authToken == null || !authToken.startsWith(Boolean.TRUE.toString())) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        try {
            service.deleteAll();
            return authToken.equals(Boolean.TRUE.toString())
                    ? Response.ok().build()
                    : Response.ok(Map.of("newAccessToken", authToken.replaceFirst(Boolean.TRUE.toString(), ""))).build();

        } catch (Exception exc) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "An unexpected error occurred while deleting all registrations: " + exc.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("players")
    public Response findPlayers(@HeaderParam("Authorization") String authToken) {
        List<ParticipantSpecification> items = service.findPlayers();
        Map<String, Object> responseMap = new HashMap<>();
        responseMap.put("data", items);

        return Response.ok(responseMap).build();
    }
    
    @GET
    @Path("coaches")
    public Response findCoaches(@HeaderParam("Authorization") String authToken) {
        List<ParticipantSpecification> items = service.findCoaches();
        Map<String, Object> responseMap = new HashMap<>();
        responseMap.put("data", items);

        return Response.ok(responseMap).build();
    }

    @GET
    @Path("/{registrationId:\\d+}")
    public Response findById(
            @HeaderParam("Authorization") String authToken,
            @PathParam("registrationId") int registrationId) {

        if (authToken == null || !authToken.startsWith(Boolean.TRUE.toString())) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        if (registrationId <= 0) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "invalid_id"))
                    .build();
        }

        // Assuming service.findById returns null when not found.
        RegistrationSpecification item = service.findById(registrationId);
        if (item == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "not_found"))
                    .build();
        }

        // Keep response shape similar to other single-item endpoints
        return Response.ok(Map.of("item", item)).build();
    }

    /**
     * Accepts: unverified/unveryfied, verified/veryfied, removed.
     */
    private static RegistrationStatus normalizeStatus(String s) {
        if (s == null) {
            return RegistrationStatus.UNVERIFIED;
        }
        String v = s.trim().toLowerCase();
        switch (v) {
            case "unverified":
                return RegistrationStatus.UNVERIFIED;
            case "verified":
                return RegistrationStatus.VERIFIED;
            case "removed":
                return RegistrationStatus.REMOVED;
            default:
                return null;
        }
    }

    /**
     * Backend canonical enum (separate from any FE enum).
     */
    public enum RegistrationStatus {
        UNVERIFIED("u", "NIEPOTWIERDZONE"),
        VERIFIED("v", "POTWIERDZONE"),
        REMOVED("r", "USUNIĘTE");

        private final String abbr, desc;

        RegistrationStatus(String abbr, String desc) {
            this.abbr = abbr;
            this.desc = desc;
        }

        /**
         * Returns the one-letter abbreviation: u / v / r.
         *
         * @return
         */
        public String abbr() {
            return abbr;
        }

        public String desc() {
            return desc;
        }

        public static RegistrationStatus getByName(String name) {
            if (name == null || name.isBlank()) {
                return UNVERIFIED;
            }

            String v = name.trim().toLowerCase(Locale.ROOT);
            return switch (v) {
                case "unverified", "u" ->
                    UNVERIFIED;
                case "verified", "v" ->
                    VERIFIED;
                case "removed", "r" ->
                    REMOVED;
                default ->
                    throw new IllegalArgumentException("Unknown registration status: " + name);
            };
        }
    }

    @GET
    @Path("/counts")
    public Response countByStatuses(@HeaderParam("Authorization") String authToken) {
        if (authToken == null || !authToken.startsWith(Boolean.TRUE.toString())) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        int unverified = service.countByStatus(RegistrationStatus.UNVERIFIED);
        int verified = service.countByStatus(RegistrationStatus.VERIFIED);
        int removed = service.countByStatus(RegistrationStatus.REMOVED);
        int coaches = service.countCoaches();
        int players = service.countPlayers();
        int all = coaches + players;

        return Response.ok(Map.of(
                "unverifiedCnt", unverified,
                "verifiedCnt", verified,
                "removedCnt", removed,
                "allCnt", all,
                "coachesCnt", coaches,
                "playersCnt", players
        )).build();
    }

//private static int safeSize(List<?> list) {
//    return list == null ? 0 : list.size();
//}
}

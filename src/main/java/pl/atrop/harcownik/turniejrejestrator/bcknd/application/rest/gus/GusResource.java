package pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.gus;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.Map;
import java.util.Optional;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.gus.dto.GusCompanyDto;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.gus.GusBirClient;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.gus.GusBirException;

@Path("gus")
@Produces(MediaType.APPLICATION_JSON)
public class GusResource {

    private final GusBirClient gusBirClient;

    public GusResource() {
        this.gusBirClient = null;
    }

    @Inject
    public GusResource(GusBirClient gusBirClient) {
        this.gusBirClient = gusBirClient;
    }

    @GET
    @Path("/by-nip/{nip}")
    public Response findByNip(@PathParam("nip") String rawNip) {
        String nip = rawNip == null ? "" : rawNip.replaceAll("\\D", "");
        if (!isValidNip(nip)) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "Nieprawidłowy NIP."))
                    .build();
        }

        try {
            Optional<GusCompanyDto> company = gusBirClient.findByNip(nip);
            return company.<Response>map(value -> Response.ok(value).build())
                    .orElseGet(() -> Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Nie znaleziono podmiotu o podanym NIP."))
                    .build());
        } catch (GusBirException ex) {
            return Response.status(Response.Status.BAD_GATEWAY)
                    .entity(Map.of("error", ex.getMessage()))
                    .build();
        }
    }

    private static boolean isValidNip(String nip) {
        if (nip == null || !nip.matches("\\d{10}")) {
            return false;
        }
        int[] weights = {6, 5, 7, 2, 3, 4, 5, 6, 7};
        int sum = 0;
        for (int i = 0; i < weights.length; i++) {
            sum += Character.digit(nip.charAt(i), 10) * weights[i];
        }
        return sum % 11 == Character.digit(nip.charAt(9), 10);
    }
}

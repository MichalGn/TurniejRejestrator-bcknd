package pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.bill;

import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.bill.dto.CreateOrModifyBillDto;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.bill.dto.SendBillEmailDto;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.security.interceptors.TokenVeryfier;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.bill.BillService;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.bill.BillSpecification;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.mail.EmailService;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.interceptors.SeparatorLogLine;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.interceptors.Timed;

/**
 *
 * @author Michał Gnatowski
 * @date 23 wrz 2025
 * @email michal.gnatowski@atrop.pl
 */
@Path("bill")
@SeparatorLogLine
@Timed
@TokenVeryfier
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class BillResource {

    private final BillService service;

    @Inject
    private EmailService emailService;

    public BillResource() {
        this.service = null;
    }

    @Inject
    public BillResource(BillService service) {
        this.service = service;
    }

    @GET
    @Path("/findMaxBillNumber")
    public Response findMaxBillNumber(@HeaderParam("Authorization") String authToken) {
        if (authToken == null || !authToken.startsWith(Boolean.TRUE.toString())) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        int maxBillNumber = service.findMaxBillNumber();
        return Response.ok(Map.of("maxBillNumber", maxBillNumber)).build();
    }

    @GET
    @Path("/{billId}")
    public Response findById(@HeaderParam("Authorization") String authToken, @PathParam("billId") int billId) {
        System.out.println("aaa__");
        if (authToken == null || !authToken.startsWith(Boolean.TRUE.toString())) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        try {
            BillSpecification item = service.edit(billId);
            Map<String, Object> responseMap = new HashMap<>();
            responseMap.put("data", item);
            if (!Boolean.TRUE.toString().equals(authToken)) {
                responseMap.put("newAccessToken", authToken.replaceFirst(Boolean.TRUE.toString(), ""));
            }
            return Response.ok(responseMap).build();

        } catch (Exception exc) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "An unexpected error occurred while deleting the product " + exc.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/counts")
    public Response countByStatuses(@HeaderParam("Authorization") String authToken) {
        if (authToken == null || !authToken.startsWith(Boolean.TRUE.toString())) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        int billsCnt = service.countByBills();
        return Response.ok(Map.of(
                "billsCnt", billsCnt
        )).build();
    }

    @POST
    public Response create(@HeaderParam("Authorization") String authToken, CreateOrModifyBillDto request) {
        if (authToken == null || !authToken.startsWith(Boolean.TRUE.toString())) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        int billId = service.createOrModify(request);

        // (Optional) basic numeric sanity checks
        /*
        if (req.getBillPaymentValueLine1() == null
                || req.getBillPaymentValueLine2() == null
                || req.getBillPaymentValueLine3() == null
                || req.getBillTotalValue() == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "All payment values and total must be provided")).build();
        }
         */
        // TODO: map CreateBillRequest -> your domain command/entity as your BillService expects
        // Example: long id = service.createBill(req);   // adjust the call to your service API
        return Response.status(Response.Status.CREATED)
                .entity(Map.of("billId", billId))
                .build();
    }

    @POST
    @Path("/{billId}/send-email")
    public Response sendBillEmail(
            @HeaderParam("Authorization") String authToken,
            @PathParam("billId") int billId,
            SendBillEmailDto request) {
        if (authToken == null || !authToken.startsWith(Boolean.TRUE.toString())) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        if (request == null || request.email() == null || request.email().isBlank()
                || request.pdfBase64() == null || request.pdfBase64().isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "Brak adresu e-mail lub pliku PDF."))
                    .build();
        }

        try {
            byte[] pdf = Base64.getDecoder().decode(request.pdfBase64());
            String fileName = request.fileName() == null || request.fileName().isBlank()
                    ? "rachunek.pdf" : request.fileName();
            emailService.sendWithAttachment(
                    request.email().trim(),
                    "Rachunek " + billId,
                    "Dzień dobry,\n\nw załączeniu przesyłamy rachunek.\n\nPozdrawiamy",
                    pdf,
                    fileName,
                    "application/pdf");
            return Response.ok(Map.of("sent", true)).build();
        } catch (IllegalArgumentException ex) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "Nieprawidłowe dane pliku PDF."))
                    .build();
        } catch (Exception ex) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "Nie udało się wysłać rachunku e-mailem: " + ex.getMessage()))
                    .build();
        }
    }

    @PUT
    public Response update(@HeaderParam("Authorization") String authToken,
            CreateOrModifyBillDto request) {
        // 401 if missing/invalid auth
        if (authToken == null || !authToken.startsWith(Boolean.TRUE.toString())) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        try {
            // Do the update (assume it throws or returns count/boolean on failure)
            int billId = service.createOrModify(request); // or service.update(request)

            // If you want to detect "not found" on update:
            // if (updatedRows == 0) return Response.status(Response.Status.NOT_FOUND).build();
            Response.ResponseBuilder rb = Response.ok(); // 200 OK

            // If you’re rotating tokens, include it in the payload.
            if (!Boolean.TRUE.toString().equals(authToken)) {
                rb.entity(Map.of("newAccessToken",
                        authToken.replaceFirst(Boolean.TRUE.toString(), "")));
            }

            return rb.build();
        } catch (Exception exc) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error",
                            "An unexpected error occurred while updating the bill: " + exc.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("all")
    public Response findAll(@HeaderParam("Authorization") String authToken) {
        if (authToken == null || !authToken.startsWith(Boolean.TRUE.toString())) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        List<BillSpecification> items = service.findAll();
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
            Response.ResponseBuilder responseBuilder = Response.ok();
            if (!Boolean.TRUE.toString().equals(authToken)) {
                responseBuilder.entity(Map.of("newAccessToken", authToken.replaceFirst(Boolean.TRUE.toString(), "")));
            }
            return responseBuilder.build();
        } catch (Exception exc) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "An unexpected error occurred while deleting all bills: " + exc.getMessage()))
                    .build();
        }
    }

    @DELETE
    @Path("/{billId}")
    public Response delete(@HeaderParam("Authorization") String authToken, @PathParam("billId") int billId) {
        if (authToken == null || !authToken.startsWith(Boolean.TRUE.toString())) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        try {
            service.delete(billId);
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

package pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.bill.dto;

public record SendBillEmailDto(
        String email,
        String fileName,
        String pdfBase64
) {
}

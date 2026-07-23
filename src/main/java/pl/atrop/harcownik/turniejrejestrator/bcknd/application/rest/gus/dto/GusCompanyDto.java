package pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.gus.dto;

public record GusCompanyDto(
        String nip,
        String name,
        String streetNo,
        String zipCode,
        String city) {
}

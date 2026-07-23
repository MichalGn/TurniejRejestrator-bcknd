package pl.atrop.harcownik.turniejrejestrator.bcknd.domain.registration;

import java.util.List;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.registration.RegistrationResource.RegistrationStatus;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.registration.dto.ClubRegisterRequestDto;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.registration.dto.IndividualRegisterRequestDto;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.registration.dto.IndividualRegisterEditDto;

/**
 *
 * @author Michał Gnatowski
 * @date 23 sie 2025
 * @email michal.gnatowski@atrop.pl
 */

public interface RegistrationService {
    long saveIndividual(IndividualRegisterRequestDto request);
    long saveClubRegistration(ClubRegisterRequestDto request);
    long saveFamilyRegistration(ClubRegisterRequestDto request);
    List<String> findEmails();
    List<RegistrationSpecification> findListByStatus(RegistrationStatus status);
    void updateStatus(int registrationId, RegistrationStatus registrationStatus);
    int countByStatus(RegistrationStatus status);
    List<ParticipantSpecification> findAll();
    List<ParticipantSpecification> findCoaches();
    int countCoaches();
    List<ParticipantSpecification> findPlayers();
    int countPlayers();
    RegistrationSpecification findById(int registrationId);
    IndividualRegisterEditDto findIndividualByUuid(String uuid);
    void updateIndividualByUuid(String uuid, IndividualRegisterRequestDto request);
    ClubRegisterRequestDto findClubByUuid(String uuid);
    ClubRegisterRequestDto findFamilyByUuid(String uuid);
    void updateClubByUuid(String uuid, ClubRegisterRequestDto request);
    void updateFamilyByUuid(String uuid, ClubRegisterRequestDto request);
    void removeClubByUuid(String uuid);
    void removeFamilyByUuid(String uuid);
    void removeIndividualByUuid(String uuid);
    void deleteAll();
}

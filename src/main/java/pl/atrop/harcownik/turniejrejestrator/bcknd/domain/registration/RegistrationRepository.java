package pl.atrop.harcownik.turniejrejestrator.bcknd.domain.registration;

import java.util.List;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.registration.RegistrationResource.RegistrationStatus;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.registration.dto.ClubRegisterRequestDto;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.registration.dto.IndividualRegisterRequestDto;

/**
 *
 * @author Michał Gnatowski
 * @date 23 sie 2025
 * @email michal.gnatowski@atrop.pl
 */

public interface RegistrationRepository {
    List<String> findEmails();
    long saveIndividual(IndividualRegisterRequestDto request);
    long saveClub(ClubRegisterRequestDto request);
    List<RegistrationSpecification> findListByStatus(RegistrationStatus status);
    void updateStatus(int registrationId, RegistrationStatus registrationStatus);
    public int countByStatus(RegistrationStatus status);
    RegistrationSpecification findById(int registrationId);
    RegistrationSpecification findByUuid(String uuid);
    void updateIndividualByUuid(String uuid, IndividualRegisterRequestDto request);
    ClubRegisterRequestDto findClubByUuid(String uuid);
    void updateClubByUuid(String uuid, ClubRegisterRequestDto request);
    void removeClubByUuid(String uuid);
    void removeIndividualByUuid(String uuid);
    void deleteAll();
    List<ParticipantSpecification> findAll();
    List<ParticipantSpecification> findCoaches();
    int countCoaches();
    List<ParticipantSpecification> findPlayers();
    int countPlayers();
}

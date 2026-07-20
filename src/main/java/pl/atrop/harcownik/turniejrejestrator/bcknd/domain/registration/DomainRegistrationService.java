package pl.atrop.harcownik.turniejrejestrator.bcknd.domain.registration;

import jakarta.inject.Inject;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.registration.RegistrationResource.RegistrationStatus;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.registration.dto.ClubRegisterRequestDto;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.registration.dto.IndividualRegisterRequestDto;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.registration.dto.IndividualRegisterEditDto;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.RepositoryType;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.configuration.general_settings.GeneralSettingRepository;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.mail.EmailService;

/**
 *
 * @author Michał Gnatowski
 * @date 23 sie 2025
 * @email michal.gnatowski@atrop.pl
 */

public class DomainRegistrationService implements RegistrationService{

    private final static String UNVERIFIED = "NIEPOTWIERDZONE";
    private final static String VERIFIED = "POTWIERDZONE";
    private final static String REMOVED = "USUNIĘTE";
    
    private final RegistrationRepository repository;
    
    @Inject 
    private EmailService emailService;
    
    private final GeneralSettingRepository generalSettingRepository;
    
    public DomainRegistrationService() {
        this.repository = null;
        generalSettingRepository = null;
    }

    @Inject
    public DomainRegistrationService(@RepositoryType("sql") RegistrationRepository repository, @RepositoryType("sql") GeneralSettingRepository gsRepository) {
        this.repository = repository;
        this.generalSettingRepository = gsRepository;
    }
    
    @Override
    public List<String> findEmails() {
        List<String> items = repository.findEmails();
        return items;
    }
    
    @Override
    public long saveIndividual(IndividualRegisterRequestDto request) {
        long out = repository.saveIndividual(request);
        RegistrationSpecification spec = repository.findById((int) out);
        String editLink = createIndividualEditLink(spec.uuid());
        sendConfirmationEmail(request.email(), request, UNVERIFIED, editLink);
        return out;
    }

    @Override
    public long saveClubRegistration(ClubRegisterRequestDto request) {
        long out = repository.saveClub(request);
        RegistrationSpecification spec = repository.findById((int) out);
        String editLink = createClubEditLink(spec.uuid());
        sendConfirmationEmail(request.contact().email(), request, UNVERIFIED, editLink);
        return out;
    }

    @Override
    public List<RegistrationSpecification> findListByStatus(RegistrationStatus status) {
        return repository.findListByStatus(status);
    }

    @Override
    public void updateStatus(int registrationId, RegistrationStatus registrationStatus) {
        repository.updateStatus(registrationId, registrationStatus);
        RegistrationSpecification registrationSpec = repository.findById(registrationId);
        sendConfirmationEmail(registrationSpec);
    }

    @Override
    public int countByStatus(RegistrationStatus status) {
        return repository.countByStatus(status);
    }

    @Override
    public void deleteAll() {
        repository.deleteAll();
    }
    
    private void sendConfirmationEmail(String email, IndividualRegisterRequestDto request, String status, String editLink) {
         StringBuilder msgSB = new StringBuilder("Status: ").append(status)
                .append("\n")
                .append(request.firstname()).append(" ").append(request.lastname()).append(":");
                msgSB.append("\n\t").append("Kategoria: ").append(request.category());
                msgSB.append("\n\t").append("Liczba gier: ").append(request.games());
                msgSB.append(createNightsAndMeals(
                        request.supperFri(), request.nightFriSat(), true, 
                        request.supperSat(), request.nightFriSat(), request.dinnerSun(), 
                        request.gender(), BigDecimal.valueOf(request.price())))
                .append("\n")
                .append("\nMiejscowość: ").append(request.city())
                .append("\nUwagi: ").append((request.comment()!=null) ? request.comment() : "")
                .append("\n")
                .append("\nOpłata całkowita: ").append(request.price()).append(" PLN")
                .append("\n\nLink do edycji zgłoszenia: ").append(editLink)
                ;
                        
        sendConfirmationEmail(email, msgSB.toString());
    }
    

    private String frontendUrl() {
        String frontendUrl = System.getenv("FRONTEND_URL");
        if (frontendUrl == null || frontendUrl.isBlank()) {
            frontendUrl = "http://localhost:4200";
        }
        if (frontendUrl.endsWith("/")) {
            frontendUrl = frontendUrl.substring(0, frontendUrl.length() - 1);
        }
        return frontendUrl;
    }

    private String createIndividualEditLink(String uuid) {
        return frontendUrl() + "/individualRegister/edit/" + uuid;
    }

    private String createClubEditLink(String uuid) {
        return frontendUrl() + "/clubRegister/edit/" + uuid;
    }

    @Override
    public IndividualRegisterEditDto findIndividualByUuid(String uuid) {
        RegistrationSpecification spec = repository.findByUuid(uuid);
        if (spec == null || spec.status() == RegistrationStatus.REMOVED || spec.players() == null || spec.players().size() != 1 || spec.clubName() != null) {
            return null;
        }
        PlayerSpecification player = spec.players().get(0);
        PersonSpecification person = player.personSpec();
        String comment = latestUnverifiedComment(spec);

        String games = switch (player.games() == null ? 0 : player.games()) {
            case 1 -> "1g";
            case 2 -> "2g";
            default -> null;
        };

        return new IndividualRegisterEditDto(
                spec.uuid(),
                person.firstname(),
                person.lastname(),
                player.birthYear(),
                person.gender(),
                player.category(),
                games,
                person.nightFriSat(),
                person.supperFri(),
                true,
                person.nightSatSun(),
                person.supperSat(),
                person.dinnerSun(),
                spec.email(),
                spec.email(),
                spec.city(),
                comment,
                spec.totalPrice() == null ? 0 : spec.totalPrice().intValue()
        );
    }


    private String latestUnverifiedComment(RegistrationSpecification spec) {
        if (spec == null || spec.statuses() == null || spec.statuses().isEmpty()) {
            return "";
        }

        return spec.statuses().stream()
                .filter(status -> RegistrationStatus.UNVERIFIED.abbr().equals(status.status()))
                .max(Comparator.comparing(StatusSpecification::datetime))
                .map(status -> status.comment() == null ? "" : status.comment())
                .orElse("");
    }

    @Override
    public void updateIndividualByUuid(String uuid, IndividualRegisterRequestDto request) {
        RegistrationSpecification spec = repository.findByUuid(uuid);
        if (spec == null || spec.status() == RegistrationStatus.REMOVED) {
            throw new IllegalArgumentException("Registration not found or removed for uuid: " + uuid);
        }
        repository.updateIndividualByUuid(uuid, request);
        String editLink = createIndividualEditLink(uuid);
        sendConfirmationEmail(request.email(), request, UNVERIFIED, editLink);
    }

    @Override
    public void removeIndividualByUuid(String uuid) {
        repository.removeIndividualByUuid(uuid);
        RegistrationSpecification registrationSpec = repository.findByUuid(uuid);
        sendConfirmationEmail(registrationSpec);
    }

    @Override
    public ClubRegisterRequestDto findClubByUuid(String uuid) {
        RegistrationSpecification spec = repository.findByUuid(uuid);
        if (spec == null || spec.status() == RegistrationStatus.REMOVED || spec.clubName() == null) {
            return null;
        }
        return repository.findClubByUuid(uuid);
    }

    @Override
    public void updateClubByUuid(String uuid, ClubRegisterRequestDto request) {
        RegistrationSpecification spec = repository.findByUuid(uuid);
        if (spec == null || spec.status() == RegistrationStatus.REMOVED || spec.clubName() == null) {
            throw new IllegalArgumentException("Registration not found or removed for uuid: " + uuid);
        }
        repository.updateClubByUuid(uuid, request);
        String editLink = createClubEditLink(uuid);
        sendConfirmationEmail(request.contact().email(), request, UNVERIFIED, editLink);
    }

    @Override
    public void removeClubByUuid(String uuid) {
        repository.removeClubByUuid(uuid);
        RegistrationSpecification registrationSpec = repository.findByUuid(uuid);
        sendConfirmationEmail(registrationSpec);
    }

    private void sendConfirmationEmail(String email, ClubRegisterRequestDto request, String status) {
        sendConfirmationEmail(email, request, status, null);
    }

    private void sendConfirmationEmail(String email, ClubRegisterRequestDto request, String status, String editLink) {
        StringBuilder msgSB = new StringBuilder("Status: ").append(status)
                .append("\n")
                .append("\nNazwa klubu: ").append(request.club().name())
                .append("\nAdres klubu: ").append(request.club().streetNo()).append(", ").append(request.club().zip_code()).append(", ").append(request.club().city())
                .append("\nNIP: ").append(request.club().nip())
                .append("\n")
                .append("\nOsoba rejestrująca: ").append(request.contact().fullName())
                .append("\nTelefon: ").append(request.contact().phone())
                .append("\nUwagi: ").append((request.comment()!=null) ? request.comment() : "")
                .append("\n")
                .append("\nOpłata całkowita: ").append(request.totals().grandTotal()).append(" PLN")
                .append("\n\n")
                ;

        if (!request.coaches().isEmpty()) {
                msgSB.append("\nTrenerzy:");
            request.coaches().forEach(coach -> {
                msgSB.append("\n").append(coach.firstname()).append(" ").append(coach.lastname()).append(":");
                msgSB.append(createNightsAndMeals(
                        coach.supperFri(), coach.nightFriSat(), coach.dinnerSat(), 
                        coach.supperSat(), coach.nightFriSat(), coach.dinnerSun(), 
                        coach.gender(), BigDecimal.valueOf(coach.fee())));
                msgSB.append("\n");
            });
        }

        if (!request.players().isEmpty()) {
            msgSB.append("\nZawodnicy:");
            request.players().forEach(player -> {
                msgSB.append("\n").append(player.firstname()).append(" ").append(player.lastname()).append(":");
                msgSB.append("\n\t").append("Rok urodzenia: ").append(player.birthYear());
                msgSB.append("\n\t").append("Kategoria: ").append(player.category());
                msgSB.append("\n\t").append("Liczba gier: ").append(player.games());
                msgSB.append(createNightsAndMeals(
                        player.supperFri(), player.nightFriSat(), true, 
                        player.supperSat(), player.nightFriSat(), player.dinnerSun(), 
                        player.gender(), BigDecimal.valueOf(player.fee())));
            });
        }

        if (editLink != null && !editLink.isBlank()) {
            msgSB.append("\n\nLink do edycji zgłoszenia: ").append(editLink);
        }

        sendConfirmationEmail(email, msgSB.toString());
    }
    
    private void sendConfirmationEmail(RegistrationSpecification spec) {
        StringBuilder msgSB = new StringBuilder("Status: ").append(spec.status().desc().toUpperCase())
                .append("\n");
        if (spec.clubName()!= null) {
            msgSB
                .append("\nNazwa klubu: ").append(spec.clubName())
                .append("\nAdres klubu: ").append(spec.streetNo()).append(", ").append(spec.zipCode()).append(", ").append(spec.city())
                .append("\nNIP: ").append(spec.nip())
                .append("\n");
        }
        
        String comment = spec.statuses().get(0).comment();
        msgSB
            .append("\nOsoba rejestrująca: ").append(Optional.ofNullable(spec.registratorName()).orElse(""))
            .append("\nTelefon: ").append(Optional.ofNullable(spec.phone()).orElse(""))
            .append("\nUwagi: ").append((comment!=null) ? comment: "")
            .append("\n")
            .append("\nOpłata całkowita: ").append(spec.totalPrice()).append(" PLN")
            .append("\n\n")
            ;

        if (!spec.coaches().isEmpty()) {
            msgSB.append("\nTrenerzy:");
            spec.coaches().forEach(coach -> {
                msgSB.append("\n").append(coach.personSpec().firstname()).append(" ").append(coach.personSpec().lastname()).append(":");
                msgSB.append(createNightsAndMeals(
                        coach.personSpec().supperFri(), coach.personSpec().nightFriSat(), coach.dinnerSat(), 
                        coach.personSpec().supperSat(), coach.personSpec().nightFriSat(), coach.personSpec().dinnerSun(), 
                        coach.personSpec().gender(), coach.personSpec().price()));
                msgSB.append("\n");
            });
        }

        if (!spec.players().isEmpty()) {
            msgSB.append("\nZawodnicy:");
            spec.players().forEach(player -> {
                msgSB.append("\n").append(player.personSpec().firstname()).append(" ").append(player.personSpec().lastname()).append(":");
                msgSB.append("\n\t").append("Rok urodzenia: ").append(player.birthYear());
                msgSB.append("\n\t").append("Kategoria: ").append(player.category());
                msgSB.append("\n\t").append("Liczba gier: ").append(player.games());
                msgSB.append(createNightsAndMeals(
                        player.personSpec().supperFri(), player.personSpec().nightFriSat(), true, 
                        player.personSpec().supperSat(), player.personSpec().nightFriSat(), player.personSpec().dinnerSun(), 
                        player.personSpec().gender(), player.personSpec().price()));
            });
        }

        appendEditLinkIfAvailable(msgSB, spec);

        sendConfirmationEmail(spec.email(), msgSB.toString());
    }
        

    private void appendEditLinkIfAvailable(StringBuilder msgSB, RegistrationSpecification spec) {
        if (spec == null || spec.uuid() == null || spec.uuid().isBlank() || spec.status() == RegistrationStatus.REMOVED) {
            return;
        }
        if (spec.clubName() != null) {
            msgSB.append("\n\nLink do edycji zgłoszenia: ").append(createClubEditLink(spec.uuid()));
            return;
        }
        if (spec.players() != null && spec.players().size() == 1) {
            msgSB.append("\n\nLink do edycji zgłoszenia: ").append(createIndividualEditLink(spec.uuid()));
        }
    }

    private void sendConfirmationEmail(String email, String msg) {
        if(generalSettingRepository.findSendEmails()) {
            String title = generalSettingRepository.findTitle();
            String ccEmails = generalSettingRepository.findCcEmails();
            System.out.println("email_1:" + email);
            System.out.println("ccEmails:" + ccEmails);
            if (ccEmails.length() > 0) {
                email += ", " + ccEmails;
            }
            System.out.println("email_2:" + email);
            System.out.println("msg:"  + msg);
            emailService.sendAsync(email, title, msg);
        }
    }
    
    private StringBuilder createNightsAndMeals(
            boolean supperFri
            ,boolean nightFriSat
            ,boolean dinnerSat
            ,boolean supperSat
            ,boolean nightSatSun
            ,boolean dinnerSun
            ,String gender
            ,BigDecimal fee
    ) {
        StringBuilder msgSB = new StringBuilder();
                if (supperFri) {
                    msgSB.append("\n\t").append("Kolacja w piątek");
                }

                if (nightFriSat) {
                    msgSB.append("\n\t").append("Nocleg pia/sob");
                }

                if (dinnerSat) {
                    msgSB.append("\n\t").append("Obiad w sobotę");
                }

                if(supperSat) {
                    msgSB.append("\n\t").append("Kolacja w sobotę");
                }

                if (nightSatSun) {
                    msgSB.append("\n\t").append("Nocleg sob/nie");
                }

                if (dinnerSun) {
                    msgSB.append("\n\t").append("Obiad w niedzielę");
                }

                String room = switch(gender) {
                    case null -> "?";
                    case "m" -> "męski";
                    case "f" -> "damski";
                    case "s" -> "jednoosobowy";
                    default -> "?";
                };

                if (nightFriSat || nightSatSun) {
                    msgSB.append("\n\t").append("Pokój ").append(room);
                }
                msgSB.append("\n\t").append("Opłata: ").append(fee).append(" PLN");
                
                return msgSB;
    }

    @Override
    public List<ParticipantSpecification> findAll() {
        return repository.findAll();
    }

    @Override
    public List<ParticipantSpecification> findCoaches() {
        return repository.findCoaches();
    }
    
    @Override
    public int countCoaches() {
       return repository.countCoaches();
    }
    
    @Override
    public List<ParticipantSpecification> findPlayers() {
        return repository.findPlayers();
    }

    @Override
    public int countPlayers() {
        return repository.countPlayers();
    }
    
    @Override
    public RegistrationSpecification findById(int registrationId) {
        return repository.findById(registrationId);
    }

}

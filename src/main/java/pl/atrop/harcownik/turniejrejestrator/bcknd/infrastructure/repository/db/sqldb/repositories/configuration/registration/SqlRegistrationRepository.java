package pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.repositories.configuration.registration;

import jakarta.ejb.Stateless;
import jakarta.ejb.TransactionAttribute;
import jakarta.ejb.TransactionAttributeType;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.registration.RegistrationResource.RegistrationStatus;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.registration.dto.ClubRegisterRequestDto;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.registration.dto.IndividualRegisterRequestDto;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.RepositoryType;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.registration.CoachSpecification;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.registration.ParticipantSpecification;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.registration.PersonSpecification;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.registration.PlayerSpecification;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.boundaries.RegistrationsFacade;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.registration.RegistrationRepository;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.registration.RegistrationSpecification;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.registration.StatusSpecification;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.boundaries.CoachesFacade;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.boundaries.CommentsFacade;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.boundaries.PlayersFacade;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.boundaries.StatusesFacade;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.entities.Coaches;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.entities.Comments;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.entities.Players;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.entities.Registrations;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.entities.Statuses;

/**
 *
 * @author Michał Gnatowski
 * @date 23 sie 2025
 * @email michal.gnatowski@atrop.pl
 */
@RepositoryType("sql")
@Stateless
@TransactionAttribute(TransactionAttributeType.REQUIRED)
public class SqlRegistrationRepository implements RegistrationRepository {

    @Inject
    private RegistrationsFacade registrationsFacade;

    @Inject
    private CommentsFacade commentsFacade;

    @Inject
    private PlayersFacade playersFacade;

    @Inject
    private CoachesFacade coachesFacade;

    @Inject
    private StatusesFacade statusesFacade;

    @Override
    @Transactional
    public List<String> findEmails() {
        return registrationsFacade.findEmails();
    }

    @Override
    public long saveIndividual(IndividualRegisterRequestDto request) {
        // 1) Rejestracja
        Registrations registration = new Registrations();
        registration.setUuid(UUID.randomUUID().toString());
        registration.setCity(request.city());
        registration.setEmail(request.email());
        registration.setTotalPrice(BigDecimal.valueOf(request.price()));
        registration.setStatus("u");
        registrationsFacade.create(registration);

        // 2) Status (zawsze twórz)
        Statuses status = new Statuses();
        status.setRegistrationId(registration);
        status.setDatetime(Date.from(Instant.now()));
        status.setStatus(RegistrationStatus.UNVERIFIED.abbr());
        statusesFacade.create(status);

        // 3) Opcjonalny komentarz (null-safe i po trimie)
        String commentText = request.comment();              // może być null
        if (commentText != null) {
            commentText = commentText.trim();
            if (!commentText.isEmpty()) {                    // tylko gdy jest treść
                Comments comment = new Comments();
                comment.setStatusId(status);
                comment.setComment(commentText);
                commentsFacade.create(comment);
            }
        }

        // 4) Gracz
        Players player = new Players();
        player.setRegistrationId(registration);
        player.setFirstname(request.firstname());
        player.setLastname(request.lastname());
        player.setBirthYear(request.birthYear());
        player.setGender(request.gender());
        player.setCategory(request.category());
        player.setGames(calcGames(request.games()));
        player.setNightFriSat(request.nightFriSat());
        player.setNightSatSun(request.nightSatSun());
        player.setSupperFri(request.supperFri());
        player.setSupperSat(request.supperSat());
        player.setDinnerSun(request.dinnerSun());
        player.setPrice(BigDecimal.valueOf(request.price()));
        playersFacade.create(player);

        return registration.getId();
    }

    @Override
    public long saveClub(ClubRegisterRequestDto request) {
        // 1) Rejestracja
        Registrations registration = new Registrations();
        registration.setUuid(UUID.randomUUID().toString());
        registration.setClubName(request.club().name());
        registration.setNip(request.club().nip());
        registration.setStreetNo(request.club().streetNo());
        registration.setZipCode(request.club().zip_code());
        registration.setCity(request.club().city());
        //niedoróbka. Brak kraju na froncie.... club.setCountry(request.club().country());
        registration.setStatus("u");

        registration.setRegistratorName(request.contact().fullName());
        registration.setEmail(request.contact().email());
        registration.setPhone("" + request.contact().phone());
        registration.setTotalPrice(BigDecimal.valueOf(request.totals().grandTotal()));

        registrationsFacade.create(registration);

        // 2) Status (zawsze twórz)
        Statuses status = new Statuses();
        status.setRegistrationId(registration);
        status.setDatetime(Date.from(Instant.now()));
        status.setStatus(RegistrationStatus.UNVERIFIED.abbr());
        statusesFacade.create(status);

        // 3) Opcjonalny komentarz (null-safe i po trimie)
        String commentText = request.comment();              // może być null
        if (commentText != null) {
            commentText = commentText.trim();
            if (!commentText.isEmpty()) {                    // tylko gdy jest treść
                Comments comment = new Comments();
                comment.setStatusId(status);
                comment.setComment(commentText);
                commentsFacade.create(comment);
            }
        }

        //Coaches
        request.coaches().forEach(coachDto -> {
            Coaches coach = new Coaches();
            coach.setRegistrationId(registration);
            coach.setFirstname(coachDto.firstname());
            coach.setLastname(coachDto.lastname());
            coach.setGender(coachDto.gender());
            coach.setSupperFri(coachDto.supperFri());
            coach.setNightFriSat(coachDto.nightFriSat());
            coach.setDinnerSat(coachDto.dinnerSat());
            coach.setSupperSat(coachDto.supperSat());
            coach.setNightSatSun(coachDto.nightSatSun());
            coach.setDinnerSun(coachDto.dinnerSun());
            coach.setPrice(BigDecimal.valueOf(coachDto.fee()));
            coachesFacade.create(coach);
        });

        request.players().forEach(playerDto -> {
            Players player = new Players();
            player.setRegistrationId(registration);
            player.setFirstname(playerDto.firstname());
            player.setLastname(playerDto.lastname());
            player.setBirthYear(playerDto.birthYear());
            player.setGender(playerDto.gender());
            player.setCategory(playerDto.category().name());
            player.setGames(calcGames(playerDto.games()));  // <-- String "1g"/"2g"
            player.setSupperFri(playerDto.supperFri());
            player.setNightFriSat(playerDto.nightFriSat());
            // player.setDinnerSat(Boolean.TRUE.equals(playerDto.dinnerSat()));
            player.setSupperSat(playerDto.supperSat());
            player.setNightSatSun(playerDto.nightSatSun());
            player.setDinnerSun(playerDto.dinnerSun());
            player.setPrice(BigDecimal.valueOf(playerDto.fee()));
            playersFacade.create(player);
        });

        return registration.getId();
    }

    private static int calcGames(String s) {
        if (s == null) {
            return 0;
        }
        return switch (s) {
            case "1g" ->
                1;
            case "2g" ->
                2;
            default ->
                0;
        };
    }

    @Override
    public List<RegistrationSpecification> findListByStatus(RegistrationStatus registrationStatus) {
        List<Registrations> registrations = registrationsFacade.findListBySthOrderBySth("status", registrationStatus.abbr(), "id", false);
        List<RegistrationSpecification> specs = new ArrayList<>();
        registrations.forEach(r -> {
            specs.add(createRegistrationSpecification(r));
        });
        return specs;
    }

    @Override
    public int countByStatus(RegistrationStatus status) {
        return (int) registrationsFacade.countByStatus(status.abbr());
    }

    @Override
    public RegistrationSpecification findById(int registrationId) {
        Registrations registration = registrationsFacade.find(registrationId);
        return this.createRegistrationSpecification(registration);
    }

    private RegistrationSpecification createRegistrationSpecification(Registrations registration) {
        List<Coaches> coaches = coachesFacade.findListBySthOrderBySth("registrationId", registration, "id", false);
        List<CoachSpecification> coachSpecs = new ArrayList<>();
        coaches.forEach(c -> {
            coachSpecs.add(createCoachSpecification(c));
        });

        List<Players> players = playersFacade.findListBySthOrderBySth("registrationId", registration, "id", false);
        List<PlayerSpecification> playerSpecs = new ArrayList<>();
        players.forEach(p -> {
            playerSpecs.add(createPlayerSpecification(p));
        });

        List<Statuses> statuses = statusesFacade.findListBySthOrderBySth("registrationId", registration, "id", false);
        List<StatusSpecification> statusSpecs = new ArrayList<>();
        statuses.forEach(s -> {
            statusSpecs.add(createStatusSpecification(s));
        });

        RegistrationSpecification spec = new RegistrationSpecification(
                registration.getId(),
                registration.getClubName(),
                registration.getNip(),
                registration.getStreetNo(),
                registration.getZipCode(),
                registration.getCity(),
                registration.getRegistratorName(),
                registration.getEmail(),
                registration.getPhone(),
                registration.getTotalPrice(),
                RegistrationStatus.getByName(registration.getStatus()),
                coachSpecs,
                playerSpecs,
                statusSpecs
        );
        return spec;
    }

    private CoachSpecification createCoachSpecification(Coaches coach) {
        CoachSpecification spec = new CoachSpecification(
                new PersonSpecification(
                        coach.getFirstname(),
                        coach.getLastname(),
                        coach.getGender(),
                        coach.getSupperFri(),
                        coach.getNightFriSat(),
                        coach.getSupperSat(),
                        coach.getNightSatSun(),
                        coach.getDinnerSun(),
                        coach.getPrice()
                ),
                coach.getDinnerSat()
        );
        return spec;
    }

    private PlayerSpecification createPlayerSpecification(Players player) {
        PlayerSpecification spec = new PlayerSpecification(
                new PersonSpecification(
                        player.getFirstname(),
                        player.getLastname(),
                        player.getGender(),
                        player.getSupperFri(),
                        player.getNightFriSat(),
                        player.getSupperSat(),
                        player.getNightSatSun(),
                        player.getDinnerSun(),
                        player.getPrice()
                ),
                player.getBirthYear(),
                player.getCategory(),
                player.getGames()
        );
        return spec;
    }

    private StatusSpecification createStatusSpecification(Statuses status) {
        String firstComment = (status.getCommentsSet() == null)
                ? null
                : status.getCommentsSet().stream()
                        .map(Comments::getComment) // if you need the text; drop map(...) if ctor wants Comments
                        .findFirst()
                        .orElse(null);

        StatusSpecification spec = new StatusSpecification(
                convertDate2LocalDateTime(status.getDatetime()),
                status.getStatus(),
                firstComment
        );
        return spec;
    }

    private LocalDateTime convertDate2LocalDateTime(Date date) {
        ZoneId zone = ZoneId.of("Europe/Warsaw");     // pick your zone (don’t rely on default)
        LocalDateTime ldt = LocalDateTime.ofInstant(date.toInstant(), zone);
        return ldt;
    }

    @Override
    @Transactional
    public void updateStatus(int registrationId, RegistrationStatus registrationStatus) {
        Registrations registration = registrationsFacade.find(registrationId);
        registration.setStatus(registrationStatus.abbr());
        registrationsFacade.edit(registration);

        Statuses status = new Statuses();
        status.setRegistrationId(registration);
        status.setDatetime(Date.from(Instant.now()));
        status.setStatus(registrationStatus.abbr());
        //... TODO dorobić comment
        statusesFacade.create(status);
    }

    @Override
    @Transactional
    public List<ParticipantSpecification> findAll() {
        List<ParticipantSpecification> allParticipantSpecs = new ArrayList<>();
        coachesFacade.findByConfirmedRegistration().forEach(coach -> {
            allParticipantSpecs.add(createParticipantSpec(coach));
        });
        playersFacade.findByConfirmedRegistration().forEach(player -> {
            allParticipantSpecs.add(createParticipantSpec(player));
        });
        return allParticipantSpecs;
    }
    
    @Override
    public List<ParticipantSpecification> findCoaches() {
        List<ParticipantSpecification> allCoachSpecs = new ArrayList<>();
        coachesFacade.findByConfirmedRegistration().forEach(coach -> {
            allCoachSpecs.add(createParticipantSpec(coach));
        });
        return allCoachSpecs;
    }
    
    @Override
    public int countCoaches() {
        return (int) coachesFacade.countByConfirmedRegistration();
    }
    
    @Override
    public List<ParticipantSpecification> findPlayers() {
        List<ParticipantSpecification> allPlayerSpecs = new ArrayList<>();
        playersFacade.findByConfirmedRegistration().forEach(player -> {
            allPlayerSpecs.add(createParticipantSpec(player));
        });
        return allPlayerSpecs;
    }
    
    @Override
    public int countPlayers() {
         return (int) playersFacade.countByConfirmedRegistration();
    }

    private ParticipantSpecification createParticipantSpec(Coaches coach) {
        return new ParticipantSpecification(
                coach.getRegistrationId().getClubName(),
                new PlayerSpecification(
                        new PersonSpecification(
                                coach.getFirstname(),
                                coach.getLastname(),
                                coach.getGender(),
                                coach.getSupperFri(),
                                coach.getNightFriSat(),
                                coach.getSupperSat(),
                                coach.getNightSatSun(),
                                coach.getDinnerSun(),
                                coach.getPrice()
                        ),
                        null,
                        "trener",
                        null
                ),
                coach.getDinnerSat()
        );
    }
    
    private ParticipantSpecification createParticipantSpec(Players player) {
        return new ParticipantSpecification(
                player.getRegistrationId().getClubName(),
                new PlayerSpecification(
                        new PersonSpecification(
                                player.getFirstname(),
                                player.getLastname(),
                                player.getGender(),
                                player.getSupperFri(),
                                player.getNightFriSat(),
                                player.getSupperSat(),
                                player.getNightSatSun(),
                                player.getDinnerSun(),
                                player.getPrice()
                        ),
                        player.getBirthYear(),
                        player.getCategory(),
                        player.getGames()
                ),
                true
        );
    }

}

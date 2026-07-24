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
        registration.setRegistrationType("INDIVIDUAL");
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
        player.setGames("ZAK".equalsIgnoreCase(request.category()) ? 1 : calcGames(request.games()));
        player.setNightFriSat(request.nightFriSat());
        player.setDinnerSat(request.dinnerSat());
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
        registration.setRegistrationType("CLUB");

        registration.setRegistratorName(request.contact().fullName());
        registration.setEmail(request.contact().email());
        registration.setPhone(request.contact().phone());
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
            player.setGames(playerDto.category() == ClubRegisterRequestDto.Category.ZAK ? 1 : calcGames(playerDto.games()));  // Żak always plays one game
            player.setSupperFri(playerDto.supperFri());
            player.setNightFriSat(playerDto.nightFriSat());
            player.setDinnerSat(Boolean.TRUE.equals(playerDto.dinnerSat()));
            player.setSupperSat(playerDto.supperSat());
            player.setNightSatSun(playerDto.nightSatSun());
            player.setDinnerSun(playerDto.dinnerSun());
            player.setPrice(BigDecimal.valueOf(playerDto.fee()));
            playersFacade.create(player);
        });

        return registration.getId();
    }

    @Override
    public long saveFamily(ClubRegisterRequestDto request) {
        Registrations registration = new Registrations();
        registration.setUuid(UUID.randomUUID().toString());
        registration.setStatus(RegistrationStatus.UNVERIFIED.abbr());
        registration.setRegistrationType("FAMILY");
        registration.setClubName(request.club() == null ? null : request.club().name());
        registration.setNip(null);
        registration.setStreetNo(null);
        registration.setZipCode(null);
        registration.setCity(null);
        registration.setRegistratorName(request.contact().fullName());
        registration.setEmail(request.contact().email());
        registration.setPhone(request.contact().phone());
        registration.setTotalPrice(BigDecimal.valueOf(request.totals().grandTotal()));
        registrationsFacade.create(registration);

        Statuses status = createStatus(registration, RegistrationStatus.UNVERIFIED);
        createCommentIfPresent(status, request.comment());
        createCoaches(registration, request);
        createPlayers(registration, request);
        return registration.getId();
    }


    private void createCommentIfPresent(Statuses status, String commentText) {
        if (commentText != null) {
            commentText = commentText.trim();
            if (!commentText.isEmpty()) {
                Comments comment = new Comments();
                comment.setStatusId(status);
                comment.setComment(commentText);
                commentsFacade.create(comment);
            }
        }
    }

    private void createCoaches(Registrations registration, ClubRegisterRequestDto request) {
        if (request.coaches() == null) {
            return;
        }
        request.coaches().forEach(coachDto -> {
            Coaches coach = new Coaches();
            coach.setRegistrationId(registration);
            coach.setFirstname(coachDto.firstname());
            coach.setLastname(coachDto.lastname());
            coach.setGender(coachDto.gender());
            coach.setSupperFri(coachDto.supperFri());
            coach.setNightFriSat(coachDto.nightFriSat());
            coach.setDinnerSat(Boolean.TRUE.equals(coachDto.dinnerSat()));
            coach.setSupperSat(coachDto.supperSat());
            coach.setNightSatSun(coachDto.nightSatSun());
            coach.setDinnerSun(coachDto.dinnerSun());
            coach.setPrice(BigDecimal.valueOf(coachDto.fee() == null ? 0 : coachDto.fee()));
            coachesFacade.create(coach);
        });
    }

    private void createPlayers(Registrations registration, ClubRegisterRequestDto request) {
        if (request.players() == null) {
            return;
        }
        request.players().forEach(playerDto -> {
            Players player = new Players();
            player.setRegistrationId(registration);
            player.setFirstname(playerDto.firstname());
            player.setLastname(playerDto.lastname());
            player.setBirthYear(playerDto.birthYear());
            player.setGender(playerDto.gender());
            player.setCategory(playerDto.category() == null ? null : playerDto.category().name());
            player.setGames(playerDto.category() == ClubRegisterRequestDto.Category.ZAK ? 1 : calcGames(playerDto.games()));
            player.setSupperFri(playerDto.supperFri());
            player.setNightFriSat(playerDto.nightFriSat());
            player.setDinnerSat(Boolean.TRUE.equals(playerDto.dinnerSat()));
            player.setSupperSat(playerDto.supperSat());
            player.setNightSatSun(playerDto.nightSatSun());
            player.setDinnerSun(playerDto.dinnerSun());
            player.setPrice(BigDecimal.valueOf(playerDto.fee() == null ? 0 : playerDto.fee()));
            playersFacade.create(player);
        });
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
        return registration == null ? null : this.createRegistrationSpecification(registration);
    }

    @Override
    public RegistrationSpecification findByUuid(String uuid) {
        if (uuid == null || uuid.isBlank()) {
            return null;
        }
        Registrations registration = registrationsFacade.findOneBySth("uuid", uuid);
        return registration == null ? null : this.createRegistrationSpecification(registration);
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
                registration.getUuid(),
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
                registration.getRegistrationType(),
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
                player.getGames(),
                Boolean.TRUE.equals(player.getDinnerSat())
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
    public ClubRegisterRequestDto findClubByUuid(String uuid) {
        RegistrationSpecification spec = findByUuid(uuid);
        if (spec == null || spec.status() == RegistrationStatus.REMOVED) {
            return null;
        }

        ClubRegisterRequestDto.ClubInfo club = new ClubRegisterRequestDto.ClubInfo(
                spec.clubName() == null ? "" : spec.clubName(),
                spec.nip(),
                spec.streetNo(),
                spec.zipCode(),
                spec.city()
        );

        ClubRegisterRequestDto.ContactInfo contact = new ClubRegisterRequestDto.ContactInfo(
                spec.registratorName(),
                spec.email(),
                spec.email(),
                spec.phone()
        );

        List<ClubRegisterRequestDto.PersonData> coaches = spec.coaches() == null ? List.of() : spec.coaches().stream()
                .map(c -> new ClubRegisterRequestDto.PersonData(
                c.personSpec().firstname(),
                c.personSpec().lastname(),
                c.personSpec().gender(),
                c.personSpec().supperFri(),
                c.personSpec().nightFriSat(),
                c.dinnerSat(),
                c.personSpec().supperSat(),
                c.personSpec().nightSatSun(),
                c.personSpec().dinnerSun(),
                c.personSpec().price() == null ? 0 : c.personSpec().price().intValue()))
                .toList();

        List<ClubRegisterRequestDto.PlayerData> players = spec.players() == null ? List.of() : spec.players().stream()
                .map(p -> new ClubRegisterRequestDto.PlayerData(
                p.personSpec().firstname(),
                p.personSpec().lastname(),
                p.birthYear(),
                p.personSpec().gender(),
                p.personSpec().supperFri(),
                p.personSpec().nightFriSat(),
                p.dinnerSat(),
                p.personSpec().supperSat(),
                p.personSpec().nightSatSun(),
                p.personSpec().dinnerSun(),
                p.personSpec().price() == null ? 0 : p.personSpec().price().intValue(),
                ClubRegisterRequestDto.Category.valueOf(p.category() == null ? "KT" : p.category()),
                Integer.valueOf(2).equals(p.games()) ? "2g" : "1g"))
                .toList();

        String comment = latestUnverifiedComment(spec);
        int coachesTotal = coaches.stream().mapToInt(c -> c.fee() == null ? 0 : c.fee()).sum();
        int playersTotal = players.stream().mapToInt(p -> p.fee() == null ? 0 : p.fee()).sum();

        return new ClubRegisterRequestDto(
                club,
                coaches,
                players,
                contact,
                comment,
                new ClubRegisterRequestDto.Totals(coachesTotal, playersTotal, coachesTotal + playersTotal)
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
    @Transactional
    public void updateClubByUuid(String uuid, ClubRegisterRequestDto request) {
        Registrations registration = registrationsFacade.findOneBySth("uuid", uuid);
        if (registration == null || !"CLUB".equals(registration.getRegistrationType()) || RegistrationStatus.REMOVED.abbr().equals(registration.getStatus())) {
            throw new IllegalArgumentException("Club registration not found or removed for uuid: " + uuid);
        }

        registration.setClubName(request.club().name());
        registration.setNip(request.club().nip());
        registration.setStreetNo(request.club().streetNo());
        registration.setZipCode(request.club().zip_code());
        registration.setCity(request.club().city());
        registration.setRegistratorName(request.contact().fullName());
        registration.setEmail(request.contact().email());
        registration.setPhone(request.contact().phone());
        registration.setTotalPrice(BigDecimal.valueOf(request.totals().grandTotal()));
        registration.setStatus(RegistrationStatus.UNVERIFIED.abbr());
        registrationsFacade.edit(registration);

        coachesFacade.findListBySthOrderBySth("registrationId", registration, "id", true)
                .forEach(coachesFacade::remove);
        playersFacade.findListBySthOrderBySth("registrationId", registration, "id", true)
                .forEach(playersFacade::remove);

        request.coaches().forEach(coachDto -> {
            Coaches coach = new Coaches();
            coach.setRegistrationId(registration);
            coach.setFirstname(coachDto.firstname());
            coach.setLastname(coachDto.lastname());
            coach.setGender(coachDto.gender());
            coach.setSupperFri(coachDto.supperFri());
            coach.setNightFriSat(coachDto.nightFriSat());
            coach.setDinnerSat(Boolean.TRUE.equals(coachDto.dinnerSat()));
            coach.setSupperSat(coachDto.supperSat());
            coach.setNightSatSun(coachDto.nightSatSun());
            coach.setDinnerSun(coachDto.dinnerSun());
            coach.setPrice(BigDecimal.valueOf(coachDto.fee() == null ? 0 : coachDto.fee()));
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
            player.setGames(playerDto.category() == ClubRegisterRequestDto.Category.ZAK ? 1 : calcGames(playerDto.games()));
            player.setSupperFri(playerDto.supperFri());
            player.setNightFriSat(playerDto.nightFriSat());
            player.setDinnerSat(Boolean.TRUE.equals(playerDto.dinnerSat()));
            player.setSupperSat(playerDto.supperSat());
            player.setNightSatSun(playerDto.nightSatSun());
            player.setDinnerSun(playerDto.dinnerSun());
            player.setPrice(BigDecimal.valueOf(playerDto.fee() == null ? 0 : playerDto.fee()));
            playersFacade.create(player);
        });


        Statuses status = createStatus(registration, RegistrationStatus.UNVERIFIED);

        String commentText = request.comment();
        if (commentText != null) {
            commentText = commentText.trim();
            if (!commentText.isEmpty()) {
                Comments comment = new Comments();
                comment.setStatusId(status);
                comment.setComment(commentText);
                commentsFacade.create(comment);
            }
        }
    }

    private void updateCommonGroupRegistration(Registrations registration, ClubRegisterRequestDto request, String registrationType) {
        if ("CLUB".equals(registrationType)) {
            registration.setClubName(request.club().name());
            registration.setNip(request.club().nip());
            registration.setStreetNo(request.club().streetNo());
            registration.setZipCode(request.club().zip_code());
            registration.setCity(request.club().city());
        } else {
            registration.setClubName(request.club() == null ? null : request.club().name());
            registration.setNip(null);
            registration.setStreetNo(null);
            registration.setZipCode(null);
            registration.setCity(null);
        }
        registration.setRegistrationType(registrationType);
        registration.setRegistratorName(request.contact().fullName());
        registration.setEmail(request.contact().email());
        registration.setPhone(request.contact().phone());
        registration.setTotalPrice(BigDecimal.valueOf(request.totals().grandTotal()));
        registration.setStatus(RegistrationStatus.UNVERIFIED.abbr());
        registrationsFacade.edit(registration);

        coachesFacade.findListBySthOrderBySth("registrationId", registration, "id", true)
                .forEach(coachesFacade::remove);
        playersFacade.findListBySthOrderBySth("registrationId", registration, "id", true)
                .forEach(playersFacade::remove);

        createCoaches(registration, request);
        createPlayers(registration, request);

        Statuses status = createStatus(registration, RegistrationStatus.UNVERIFIED);
        createCommentIfPresent(status, request.comment());
    }

    @Override
    public ClubRegisterRequestDto findFamilyByUuid(String uuid) {
        RegistrationSpecification spec = findByUuid(uuid);
        if (spec == null || !"FAMILY".equals(spec.registrationType()) || spec.status() == RegistrationStatus.REMOVED) {
            return null;
        }
        return findClubByUuid(uuid);
    }

    @Override
    @Transactional
    public void updateFamilyByUuid(String uuid, ClubRegisterRequestDto request) {
        Registrations registration = registrationsFacade.findOneBySth("uuid", uuid);
        if (registration == null || !"FAMILY".equals(registration.getRegistrationType()) || RegistrationStatus.REMOVED.abbr().equals(registration.getStatus())) {
            throw new IllegalArgumentException("Family registration not found or removed for uuid: " + uuid);
        }
        updateCommonGroupRegistration(registration, request, "FAMILY");
    }

    @Override
    @Transactional
    public void removeFamilyByUuid(String uuid) {
        Registrations registration = registrationsFacade.findOneBySth("uuid", uuid);
        if (registration == null || !"FAMILY".equals(registration.getRegistrationType()) || RegistrationStatus.REMOVED.abbr().equals(registration.getStatus())) {
            throw new IllegalArgumentException("Family registration not found or already removed for uuid: " + uuid);
        }

        registration.setStatus(RegistrationStatus.REMOVED.abbr());
        registrationsFacade.edit(registration);
        createStatus(registration, RegistrationStatus.REMOVED);
    }

    @Override
    @Transactional
    public void removeClubByUuid(String uuid) {
        Registrations registration = registrationsFacade.findOneBySth("uuid", uuid);
        if (registration == null || !"CLUB".equals(registration.getRegistrationType()) || RegistrationStatus.REMOVED.abbr().equals(registration.getStatus())) {
            throw new IllegalArgumentException("Club registration not found or already removed for uuid: " + uuid);
        }

        registration.setStatus(RegistrationStatus.REMOVED.abbr());
        registrationsFacade.edit(registration);
        createStatus(registration, RegistrationStatus.REMOVED);
    }

    private Statuses createStatus(Registrations registration, RegistrationStatus registrationStatus) {
        Statuses status = new Statuses();
        status.setRegistrationId(registration);
        status.setDatetime(Date.from(Instant.now()));
        status.setStatus(registrationStatus.abbr());
        statusesFacade.create(status);
        return status;
    }

    @Override
    @Transactional
    public void updateIndividualByUuid(String uuid, IndividualRegisterRequestDto request) {
        Registrations registration = registrationsFacade.findOneBySth("uuid", uuid);
        if (registration == null || RegistrationStatus.REMOVED.abbr().equals(registration.getStatus())) {
            throw new IllegalArgumentException("Registration not found or removed for uuid: " + uuid);
        }

        List<Players> players = playersFacade.findListBySthOrderBySth("registrationId", registration, "id", true);
        if (players.size() != 1 || registration.getClubName() != null) {
            throw new IllegalStateException("Only individual registrations can be edited by public UUID link");
        }

        registration.setCity(request.city());
        registration.setEmail(request.email());
        registration.setTotalPrice(BigDecimal.valueOf(request.price()));
        registration.setStatus(RegistrationStatus.UNVERIFIED.abbr());
        registrationsFacade.edit(registration);

        Players player = players.get(0);
        player.setFirstname(request.firstname());
        player.setLastname(request.lastname());
        player.setBirthYear(request.birthYear());
        player.setGender(request.gender());
        player.setCategory(request.category());
        player.setGames("ZAK".equalsIgnoreCase(request.category()) ? 1 : calcGames(request.games()));
        player.setNightFriSat(request.nightFriSat());
        player.setDinnerSat(request.dinnerSat());
        player.setNightSatSun(request.nightSatSun());
        player.setSupperFri(request.supperFri());
        player.setSupperSat(request.supperSat());
        player.setDinnerSun(request.dinnerSun());
        player.setPrice(BigDecimal.valueOf(request.price()));
        playersFacade.edit(player);

        Statuses status = new Statuses();
        status.setRegistrationId(registration);
        status.setDatetime(Date.from(Instant.now()));
        status.setStatus(RegistrationStatus.UNVERIFIED.abbr());
        statusesFacade.create(status);

        String commentText = request.comment();
        if (commentText != null) {
            commentText = commentText.trim();
            if (!commentText.isEmpty()) {
                Comments comment = new Comments();
                comment.setStatusId(status);
                comment.setComment(commentText);
                commentsFacade.create(comment);
            }
        }
    }

    @Override
    @Transactional
    public void removeIndividualByUuid(String uuid) {
        Registrations registration = registrationsFacade.findOneBySth("uuid", uuid);
        if (registration == null || RegistrationStatus.REMOVED.abbr().equals(registration.getStatus())) {
            throw new IllegalArgumentException("Registration not found or already removed for uuid: " + uuid);
        }

        List<Players> players = playersFacade.findListBySthOrderBySth("registrationId", registration, "id", true);
        if (players.size() != 1 || registration.getClubName() != null) {
            throw new IllegalStateException("Only individual registrations can be removed by public UUID link");
        }

        registration.setStatus(RegistrationStatus.REMOVED.abbr());
        registrationsFacade.edit(registration);

        Statuses status = new Statuses();
        status.setRegistrationId(registration);
        status.setDatetime(Date.from(Instant.now()));
        status.setStatus(RegistrationStatus.REMOVED.abbr());
        statusesFacade.create(status);
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

    @Override
    @Transactional
    public void deleteAll() {
        registrationsFacade.deleteAllWithChildren();
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
                        null,
                        Boolean.TRUE.equals(coach.getDinnerSat())
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
                        player.getGames(),
                        Boolean.TRUE.equals(player.getDinnerSat())
                ),
                Boolean.TRUE.equals(player.getDinnerSat())
        );
    }

}

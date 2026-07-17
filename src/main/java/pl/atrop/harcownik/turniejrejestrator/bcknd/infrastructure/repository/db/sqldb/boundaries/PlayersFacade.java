package pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.boundaries;

import jakarta.ejb.Stateless;
import java.util.List;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.registration.RegistrationResource.RegistrationStatus;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.entities.Players;

/**
 *
 * @author Michał Gnatowski
 * @date 26 sie 2025
 * @email michal.gnatowski@atrop.pl
 */
@Stateless
public class PlayersFacade extends AbstractFacade<Players> {

    public PlayersFacade() {
        super(Players.class);
    }

    public List<Players> findByConfirmedRegistration() {
        return getEntityManager()
                .createQuery(
                        "SELECT DISTINCT p "
                        + "FROM Players p "
                        + "LEFT JOIN p.registrationId r "
                        + "WHERE r.status = :status "
                        + "ORDER BY p.lastname",
                        Players.class)
                .setParameter("status", RegistrationStatus.VERIFIED.abbr())
                .getResultList();
    }

    public long countByConfirmedRegistration() {
        return getEntityManager()
                .createQuery(
                        "SELECT COUNT(p) "
                        + "FROM Players p "
                        + "JOIN p.registrationId r "
                        + "WHERE r.status = :status", Long.class)
                .setParameter("status", RegistrationStatus.VERIFIED.abbr())
                .getSingleResult();
    }

}

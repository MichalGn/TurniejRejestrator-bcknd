package pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.boundaries;

import jakarta.ejb.Stateless;
import java.util.List;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.registration.RegistrationResource.RegistrationStatus;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.entities.Coaches;

/**
 *
 * @author Michał Gnatowski
 * @date 26 sie 2025
 * @email michal.gnatowski@atrop.pl
 */
@Stateless
public class CoachesFacade extends AbstractFacade<Coaches> {

    public CoachesFacade() {
        super(Coaches.class);
    }

    public List<Coaches> findByConfirmedRegistration() {
        return getEntityManager()
                .createQuery(
                        "SELECT DISTINCT c "
                        + "FROM Coaches c "
                        + "LEFT JOIN c.registrationId r "
                        + "WHERE r.status = :status "
                        + "ORDER BY c.lastname",
                        Coaches.class)
                .setParameter("status", RegistrationStatus.VERIFIED.abbr())
                .getResultList();
    }
    
    public long countByConfirmedRegistration() {
        return getEntityManager()
                .createQuery(
                        "SELECT COUNT(c) "
                        + "FROM Coaches c "
                        + "JOIN c.registrationId r "
                        + "WHERE r.status = :status", Long.class)
                .setParameter("status", RegistrationStatus.VERIFIED.abbr())
                .getSingleResult();
    }

   
}
 
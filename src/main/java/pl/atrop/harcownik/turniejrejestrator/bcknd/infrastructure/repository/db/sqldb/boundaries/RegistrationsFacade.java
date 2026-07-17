package pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.boundaries;

import jakarta.ejb.Stateless;
import jakarta.persistence.TypedQuery;
import java.util.List;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.entities.Registrations;

/**
 *
 * @author Michał Gnatowski
 * @date 9 sie 2025
 * @email michal.gnatowski@atrop.pl
 */

@Stateless
public class RegistrationsFacade extends AbstractFacade<Registrations> {

    public List<String> findEmails() {
        TypedQuery<String> query = getEntityManager().createQuery(
            "SELECT DISTINCT r.email " +
            "FROM Registrations r " +
            "WHERE r.status <> :removed " +
            "AND r.email IS NOT NULL",
            String.class
        );
        query.setParameter("removed", "r");
        return query.getResultList();
    }

    public RegistrationsFacade() {
        super(Registrations.class);
    }
}

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

    public int deleteAllWithChildren() {
        getEntityManager().createNativeQuery("UPDATE bills SET registration_id = NULL").executeUpdate();
        getEntityManager().createNativeQuery("DELETE FROM comments WHERE status_id IN (SELECT id FROM statuses)").executeUpdate();
        getEntityManager().createNativeQuery("DELETE FROM statuses").executeUpdate();
        getEntityManager().createNativeQuery("DELETE FROM coaches").executeUpdate();
        getEntityManager().createNativeQuery("DELETE FROM players").executeUpdate();
        return getEntityManager().createNativeQuery("DELETE FROM registrations").executeUpdate();
    }
}

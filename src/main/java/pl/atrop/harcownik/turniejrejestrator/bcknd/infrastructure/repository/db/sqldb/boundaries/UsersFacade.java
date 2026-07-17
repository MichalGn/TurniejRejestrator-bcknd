package pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.boundaries;

import jakarta.ejb.Stateless;
import jakarta.persistence.NoResultException;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import java.util.List;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.entities.Users;

/**
 *
 * @author Michał Gnatowski
 * @date 9 sie 2025
 * @email michal.gnatowski@atrop.pl
 */

@Stateless
public class UsersFacade extends AbstractFacade<Users> {

    public UsersFacade() {
        super(Users.class);
    }

    public Users findUserByUsernameAndPassword(String username, String password) {
        CriteriaBuilder criteriaBuilder = getEntityManager().getCriteriaBuilder();
        CriteriaQuery<Users> criteriaQuery = criteriaBuilder.createQuery(Users.class);
        Root<Users> root = criteriaQuery.from(Users.class);

        // Create predicates for username, password, and active status
        Predicate usernamePredicate = criteriaBuilder.equal(root.get("username"), username);
        Predicate passwordPredicate = criteriaBuilder.equal(root.get("password"), password);
        Predicate activePredicate = criteriaBuilder.isTrue(root.get("active"));

        // Combine the predicates
        Predicate andPredicate = criteriaBuilder.and(usernamePredicate, passwordPredicate, activePredicate);
        criteriaQuery.select(root).where(andPredicate);

        // Execute the query
        TypedQuery<Users> query = getEntityManager().createQuery(criteriaQuery);
        try {
            return query.getSingleResult();
        } catch (NoResultException e) {
            return null; // User not found
        }
    }
    
        
    public List<String> findUsernames() {
        TypedQuery<String> query = getEntityManager().createQuery(
                "SELECT u.username FROM Users u ",
                String.class
        );
        return query.getResultList();
    }
}

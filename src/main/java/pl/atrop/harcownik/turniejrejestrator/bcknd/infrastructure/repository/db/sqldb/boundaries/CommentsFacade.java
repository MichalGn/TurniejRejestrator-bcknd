package pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.boundaries;

import jakarta.ejb.Stateless;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.entities.Comments;

/**
 *
 * @author Michał Gnatowski
 * @date 9 sie 2025
 * @email michal.gnatowski@atrop.pl
 */

@Stateless
public class CommentsFacade extends AbstractFacade<Comments> {

//    @PersistenceContext(unitName = "turniejrejestratorPU")
//    private EntityManager em;
//
//    @Override
//    protected EntityManager getEntityManager() {
//        return em;
//    }

    public CommentsFacade() {
        super(Comments.class);
    }

}

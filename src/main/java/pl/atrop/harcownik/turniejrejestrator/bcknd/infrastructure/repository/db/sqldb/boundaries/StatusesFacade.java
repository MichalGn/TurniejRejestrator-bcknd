package pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.boundaries;

import jakarta.ejb.Stateless;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.entities.Statuses;

/**
 *
 * @author Michał Gnatowski
 * @date 24 sie 2025
 * @email michal.gnatowski@atrop.pl
 */
@Stateless
public class StatusesFacade  extends AbstractFacade<Statuses>{
    public StatusesFacade() {
        super(Statuses.class);
    }
}
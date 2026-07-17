package pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.boundaries;

import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.entities.BillComments;

/**
 *
 * @author Michał Gnatowski
 * @date 20 wrz 2025
 * @email michal.gnatowski@atrop.pl
 */

public class BillCommentsFacade extends AbstractFacade<BillComments> {

    public BillCommentsFacade() {
        super(BillComments.class);
    }

}

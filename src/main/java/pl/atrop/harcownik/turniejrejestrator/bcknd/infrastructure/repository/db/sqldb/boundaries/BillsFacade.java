package pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.boundaries;

import jakarta.ejb.Stateless;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.entities.Bills;

/**
 *
 * @author Michał Gnatowski
 * @date 20 wrz 2025
 * @email michal.gnatowski@atrop.pl
 */

@Stateless
public class BillsFacade extends AbstractFacade<Bills> {

    public BillsFacade() {
        super(Bills.class);
    }
    
    public int findMaxBillNumber() {
          Integer max = getEntityManager()
            .createQuery("SELECT MAX(b.billNumber) FROM Bills b", Integer.class)
            .getSingleResult();  // returns null if table empty or all values null
        return max != null ? max : 0;
    }

}

package pl.atrop.harcownik.turniejrejestrator.bcknd.domain.bill;

import java.util.List;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.bill.dto.CreateOrModifyBillDto;

/**
 *
 * @author Michał Gnatowski
 * @date 23 wrz 2025
 * @email michal.gnatowski@atrop.pl
 */

public interface BillRepository {
    int countByBills();
    int findMaxBillNumber();
    int createOrModify(CreateOrModifyBillDto request);
    List<BillSpecification> findAll();
    void delete(int billId);
    BillSpecification edit(int billId);
}

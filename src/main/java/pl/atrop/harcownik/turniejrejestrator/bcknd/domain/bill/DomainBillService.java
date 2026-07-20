package pl.atrop.harcownik.turniejrejestrator.bcknd.domain.bill;

import jakarta.inject.Inject;
import java.util.List;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.bill.dto.CreateOrModifyBillDto;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.RepositoryType;

/**
 *
 * @author Michał Gnatowski
 * @date 23 wrz 2025
 * @email michal.gnatowski@atrop.pl
 */

public class DomainBillService implements BillService{

    private final BillRepository repository;
    
     public DomainBillService() {
        this.repository = null;
    }

    @Inject
    public DomainBillService(@RepositoryType("sql") BillRepository repository) {
        this.repository = repository;
    }
    
    @Override
    public int countByBills() {
        return repository.countByBills();
    }
    
     @Override
    public int findMaxBillNumber() {
        return repository.findMaxBillNumber();
    }

    @Override
    public int createOrModify(CreateOrModifyBillDto request) {
        return repository.createOrModify(request);
    }

    @Override
    public List<BillSpecification> findAll() {
        return repository.findAll();
    }

    @Override
    public void delete(int billId) {
        repository.delete(billId);
    }

    @Override
    public void deleteAll() {
        repository.deleteAll();
    }

    @Override
    public BillSpecification edit(int billId) {
        return  repository.edit(billId);
    }

}

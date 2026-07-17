package pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.repositories.configuration.general_settings;

import jakarta.ejb.Stateless;
import jakarta.ejb.TransactionAttribute;
import jakarta.ejb.TransactionAttributeType;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.ArrayList;
import java.util.List;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.RepositoryType;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.configuration.general_settings.GeneralSettingRepository;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.configuration.general_settings.GeneralSettingSpecification;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.boundaries.GeneralSettingsFacade;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.entities.GeneralSettings;

/**
 *
 * @author Michał Gnatowski
 * @date 14 sie 2025
 * @email michal.gnatowski@atrop.pl
 */

@RepositoryType("sql")
@Stateless
@TransactionAttribute(TransactionAttributeType.REQUIRED)
public class SqlGeneralSettingRepository implements GeneralSettingRepository{

    @Inject private GeneralSettingsFacade generalSettingsFacade;
    
    @Override
    @Transactional
    public void createOrModify(String label, Object value) {
        GeneralSettings gs = generalSettingsFacade.findOneByKey(label);
        if (gs == null) {
            gs = new GeneralSettings();
            gs.setKey1(label);
        }
        gs.setValue1(""+value);
        if (gs == null) {
            generalSettingsFacade.create(gs);
        } else {
            generalSettingsFacade.edit(gs);
        }
    }
    
    @Override
    @Transactional
    public List<GeneralSettingSpecification> findAll() {
        List<GeneralSettingSpecification> specs = new ArrayList<>();
        List<GeneralSettings> gss = generalSettingsFacade.findAll();
        gss.stream().forEach(gs -> {
            specs.add(
                new GeneralSettingSpecification(gs.getKey1(), gs.getValue1())
            );
        });
        return specs;
    }
    
    @Override
    @Transactional
    public GeneralSettingSpecification findByKey1(String key1) {
        GeneralSettings gs = generalSettingsFacade.findOneBySth("key1", key1);
        return new GeneralSettingSpecification(key1, gs!=null ? gs.getValue1() : "");
    }

    @Override
    public String findTitle() {
        return findByKey1("title").value1();
    }

    @Override
    public boolean findSendEmails() {
        String val1 = findByKey1("sendEmails").value1();
        return val1.trim().startsWith("t") || val1.trim().startsWith("y");
    }

    @Override
    public String findCcEmails() {
        return findByKey1("ccEmails").value1().trim();
    }

}

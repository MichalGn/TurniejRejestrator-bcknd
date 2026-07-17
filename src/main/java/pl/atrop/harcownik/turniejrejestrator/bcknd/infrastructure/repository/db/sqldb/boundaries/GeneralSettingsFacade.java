package pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.boundaries;

import jakarta.ejb.Stateless;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.HashMap;
import java.util.Map;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.entities.GeneralSettings;

/**
 *
 * @author Michał Gnatowski
 * @date 9 sie 2025
 * @email michal.gnatowski@atrop.pl
 */

@Stateless
public class GeneralSettingsFacade extends AbstractFacade<GeneralSettings> {

    public static final String BILL_NUMBER_SUFFIX = "bill_number_suffix";

    
//    @PersistenceContext(unitName = "turniejrejestratorPU")
//    private EntityManager em;
//
//    @Override
//    protected EntityManager getEntityManager() {
//        return em;
//    }

    public GeneralSettingsFacade() {
        super(GeneralSettings.class);
    }

    public GeneralSettings findOneByKey(String key) {
        Map<String, Object> map = new HashMap<>();
        map.put("key1", key);
        return findOneBySth(map);
    }
}

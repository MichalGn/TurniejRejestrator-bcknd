package pl.atrop.harcownik.turniejrejestrator.bcknd.domain.configuration.general_settings;

import jakarta.inject.Inject;
import java.util.List;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.RepositoryType;

/**
 *
 * @author Michał Gnatowski
 * @date 14 sie 2025
 * @email michal.gnatowski@atrop.pl
 */

public class DomainGeneralSettingsService implements GeneralSettingsService {

    private final GeneralSettingRepository repository;
  
    public DomainGeneralSettingsService() {
        this.repository = null;
    }

    @Inject
    public DomainGeneralSettingsService(@RepositoryType("sql") GeneralSettingRepository repository) {
        this.repository = repository;
    }
    
    @Override
    public void createOrModify(String label, Object value) {
        repository.createOrModify(label, value);
    }

    @Override
    public List<GeneralSettingSpecification> findAll() {
        return repository.findAll();
    }

    @Override
    public GeneralSettingSpecification findByKey1(String key1) {
        return repository.findByKey1(key1);
    }

}

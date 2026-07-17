package pl.atrop.harcownik.turniejrejestrator.bcknd.domain.configuration.general_settings;

import java.util.List;

/**
 *
 * @author Michał Gnatowski
 * @date 14 sie 2025
 * @email michal.gnatowski@atrop.pl
 */

public interface GeneralSettingsService {
    void createOrModify(String label, Object value);
    List<GeneralSettingSpecification> findAll();
    GeneralSettingSpecification findByKey1(String key1);
}

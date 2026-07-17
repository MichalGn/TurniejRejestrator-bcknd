package pl.atrop.harcownik.turniejrejestrator.bcknd.domain.configuration.user;

import java.util.List;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.configuration.user.dto.SelfProfileUpdateDto;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.configuration.user.dto.UpdateUserDto;


/**
 *
 * @author Michał Gnatowski
 * @date 9 sie 2025
 * @email michal.gnatowski@atrop.pl
 */
public interface UserRepository {

    UserSpecification findByUsernameAndPassword(String username, String password);

    void createUserAdminIfNoUsers();

    List<String> findUsernames();

    void modifySelfuser(SelfProfileUpdateDto selfuserModify);

    List<UserSpecification> findAll(boolean activeOnly);

    void createOrModify(UserSpecification userSpec);
    
    void delete(int id);
}

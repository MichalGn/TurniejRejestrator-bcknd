package pl.atrop.harcownik.turniejrejestrator.bcknd.domain.configuration.user;

import jakarta.ejb.Stateless;
import java.util.List;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.configuration.user.dto.SelfProfileUpdateDto;

/**
 *
 * @author Michał Gnatowski
 * @date 11 lis 2024
 * @email michal.gnatowski@atrop.pl
 */

@Stateless
public interface UserService {//extends Hashable {
    UserSpecification getByUsernameAndPassword(String username, String password);
    List<String> findUsernames();
    void modifySelfuser(SelfProfileUpdateDto selfuserModify);
    List<UserSpecification> findAll(boolean activeOnly);
    void createOrModify(UserSpecification userSpec);
    void delete(int id);
    
}


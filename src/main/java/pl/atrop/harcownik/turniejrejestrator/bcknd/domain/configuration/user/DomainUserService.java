package pl.atrop.harcownik.turniejrejestrator.bcknd.domain.configuration.user;

import jakarta.inject.Inject;
import java.util.List;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.configuration.user.dto.SelfProfileUpdateDto;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.configuration.user.dto.UpdateUserDto;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.RepositoryType;

/**
 *
 * @author Michał Gnatowski
 * @date 27 lip 2025
 * @email michal.gnatowski@atrop.pl
 */

public class DomainUserService implements UserService {

    private final UserRepository repository;
  
    public DomainUserService() {
        this.repository = null;
    }

    @Inject
    public DomainUserService(@RepositoryType("sql") UserRepository repository) {
        this.repository = repository;
    }
    
    @Override
    public UserSpecification getByUsernameAndPassword(String username, String password) {
        UserSpecification out = repository.findByUsernameAndPassword(username, password);
        return out;
    }
    
    @Override
    public List<String> findUsernames() {
        List<String> items = repository.findUsernames();
        return items;
    }
    
    @Override
    public void modifySelfuser(SelfProfileUpdateDto selfuserModify) {
        repository.modifySelfuser(selfuserModify);
    }
    
    @Override
    public List<UserSpecification> findAll(boolean activeOnly) {
        return repository.findAll(activeOnly);
    }
   
    @Override
    public void createOrModify(UserSpecification userSpec) {
        repository.createOrModify(userSpec);
    }
    
    @Override
    public void delete(int userId) {
        repository.delete(userId);
    }
    
    /*
    @Override
    public UserSpecification getByUsernameAndPassword(String username, String password) {
        UserSpecification out = repository.findByUsernameAndPassword(username, password);
        return out;
    }

   

    @Override
    public boolean canCreate(UserSpecification userSpec) {
        throw new UnsupportedOperationException("Not supported yet."); // Generated from nbfs://nbhost/SystemFileSystem/Templates/Classes/Code/GeneratedMethodBody
    }

    @Override
    public boolean canDelete(int id) {
        throw new UnsupportedOperationException("Not supported yet."); // Generated from nbfs://nbhost/SystemFileSystem/Templates/Classes/Code/GeneratedMethodBody
    }

    @Override
    public void delete(int id) {
        throw new UnsupportedOperationException("Not supported yet."); // Generated from nbfs://nbhost/SystemFileSystem/Templates/Classes/Code/GeneratedMethodBody
    }

    @Override
    public void deleteAll() {
        throw new UnsupportedOperationException("Not supported yet."); // Generated from nbfs://nbhost/SystemFileSystem/Templates/Classes/Code/GeneratedMethodBody
    }

    

    @Override
    public Integer findUsernamesHash() {
        throw new UnsupportedOperationException("Not supported yet."); // Generated from nbfs://nbhost/SystemFileSystem/Templates/Classes/Code/GeneratedMethodBody
    }
*/
}

package pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.repositories.configuration.user;

import jakarta.ejb.Stateless;
import jakarta.ejb.TransactionAttribute;
import jakarta.ejb.TransactionAttributeType;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.ArrayList;
import java.util.List;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.configuration.user.dto.SelfProfileUpdateDto;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.configuration.user.dto.UpdateUserDto;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.RepositoryType;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.configuration.user.UserRepository;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.configuration.user.UserSpecification;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.boundaries.UsersFacade;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.entities.Users;

/**
 *
 * @author Michał Gnatowski
 * @date 9 sie 2025
 * @email michal.gnatowski@atrop.pl
 */

@RepositoryType("sql")
@Stateless
@TransactionAttribute(TransactionAttributeType.REQUIRED)
public class SqlUserRepository implements UserRepository{

    @Inject
    private UsersFacade usersFacade;

    @Override
    public UserSpecification findByUsernameAndPassword(String username, String password) {
        Users user = usersFacade.findUserByUsernameAndPassword(username, password);
        return createSpecification(user);
    }
    
    @Override
    @Transactional
    public void createUserAdminIfNoUsers() {
        if (usersFacade.countByActive() == 0) {
            Users user = new Users();
            user.setUsername("admin");
            user.setPassword("MjEyMzJmMjk3YTU3YTVhNzQzODk0YTBlNGE4MDFmYzM=");
            user.setAdmin(Boolean.TRUE);
            user.setActive(Boolean.TRUE);
            usersFacade.create(user);
        }
    }
    
    @Override
    @Transactional
    public List<String> findUsernames() {
        return usersFacade.findUsernames();
    }
    
    @Override
    @Transactional
    public void modifySelfuser(SelfProfileUpdateDto selfuserModify) {
        Users user = usersFacade.find(selfuserModify.id());
        user.setUsername(selfuserModify.username());
        user.setFirstname(selfuserModify.firstname());
        user.setLastname(selfuserModify.lastname());
        if (selfuserModify.changePassword()) {
            if (user.getPassword().equals(selfuserModify.oldPassword())) {
                user.setPassword(selfuserModify.newPassword());
            } else {
                throw new IllegalArgumentException("BAD_OLD_PASS");
            }
        }

        usersFacade.edit(user);
    }
    
    @Override
    @Transactional
    public List<UserSpecification> findAll(boolean activeOnly) {
        List<UserSpecification> specs = new ArrayList<>();
        List<Users> users = activeOnly
                ? usersFacade.findListBySthOrderBySth("active", true, "username", true)
                : usersFacade.findAllOrderBySth("username", true);
        users.forEach(item -> {
            specs.add(createSpecification(item));
        });
        return specs;
    }
    
    @Transactional
    @Override
    public void createOrModify(UserSpecification userSpec) {
        System.out.println("createOrModify, userSpec:" + userSpec);
        Users user;
        if (userSpec.id() == null) {
            user = new Users();
        } else {
            user = usersFacade.find(userSpec.id());
        }
        user.setUsername(userSpec.username());
        user.setFirstname(userSpec.firstname());
        user.setLastname(userSpec.lastname());
        if (userSpec.password()!=null)
            user.setPassword(userSpec.password());
        user.setAdmin(userSpec.admin());
        if (userSpec.id() == null) {
            user.setActive(true);
            usersFacade.create(user);
        } else {
            user.setActive(userSpec.active());
            usersFacade.edit(user);
        }
    }
    
    @Override
    @Transactional
    public void delete(int id) {
        Users user = usersFacade.find(id);
        if (user == null) {
            return;
        }
        usersFacade.remove(user);
    }
    
    private UserSpecification createSpecification(Users user) {
        if (user != null) {
            UserSpecification spec = new UserSpecification(
                user.getId(),
                user.getUsername(),
                user.getFirstname(),
                user.getLastname(),
                user.getPassword(),
                user.getAdmin(),
                user.getActive()
            );
            return spec;
        } else {
            return null;
        }
    }
    
}

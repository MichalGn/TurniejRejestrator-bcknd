package pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.startup;

import jakarta.annotation.PostConstruct;
import jakarta.ejb.Singleton;
import jakarta.ejb.Startup;
import jakarta.inject.Inject;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.RepositoryType;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.configuration.user.UserRepository;

/**
 *
 * @author Michał Gnatowski
 * @date 9 sie 2025
 * @email michal.gnatowski@atrop.pl
 */

@Singleton
@Startup
public class StartupListener {

  
    private final UserRepository userRepository;

    public StartupListener() {
        this.userRepository = null;
    }

    @Inject
    public StartupListener(@RepositoryType("sql") UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostConstruct
    public void init() {
        System.out.println("Start aplikacji TurniejRejestrator");
        userRepository.createUserAdminIfNoUsers();
    }
}

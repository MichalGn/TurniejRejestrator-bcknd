package pl.atrop.harcownik.turniejrejestrator.bcknd.domain.configuration.user;


/**
 *
 * @author Michał Gnatowski
 * @date 11 lis 2024
 * @email michal.gnatowski@atrop.pl
 */

public record UserSpecification(
        Integer id,
        String username,
        String firstname,
        String lastname,
        String password,
        boolean admin,
        boolean active
               ) {
    
//    @Override
//    public String toString() {
//        return "UserSpecification[ id=" + id + ", username=" + username + " ]";
//    }
}
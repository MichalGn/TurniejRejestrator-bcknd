package pl.atrop.harcownik.turniejrejestrator.bcknd.domain;

import jakarta.inject.Qualifier;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 *
 * @author Michał Gnatowski
 * @date 11 lis 2024
 * @email michal.gnatowski@atrop.pl
 */

@Qualifier
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE, ElementType.FIELD, ElementType.PARAMETER, ElementType.METHOD})
public @interface RepositoryType {

    String value();
}

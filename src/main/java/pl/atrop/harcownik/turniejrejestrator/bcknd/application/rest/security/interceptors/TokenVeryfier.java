package pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.security.interceptors;

import jakarta.interceptor.InterceptorBinding;
import static java.lang.annotation.ElementType.METHOD;
import static java.lang.annotation.ElementType.TYPE;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 *
 * @author Michał Gnatowski
 * @date 03.01.2023 18.50.27
 * @email michal.gnatowski@atrop.pl
 */
@InterceptorBinding
@Retention(RetentionPolicy.RUNTIME)
@Target({METHOD, TYPE})
public @interface TokenVeryfier {
}
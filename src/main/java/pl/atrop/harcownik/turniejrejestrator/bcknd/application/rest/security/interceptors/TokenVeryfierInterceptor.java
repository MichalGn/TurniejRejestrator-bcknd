package pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.security.interceptors;

import jakarta.inject.Inject;
import jakarta.interceptor.AroundInvoke;
import jakarta.interceptor.Interceptor;
import jakarta.interceptor.InvocationContext;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.security.TokenService;

/**
 *
 * @author Michał Gnatowski
 * @date 03.01.2023 18.51.19
 * @email michal.gnatowski@atrop.pl
 */
@Interceptor
@TokenVeryfier
public class TokenVeryfierInterceptor {

    @Inject
    private TokenService tokenService;

    @AroundInvoke
    public Object verifyInvocation(InvocationContext ctx) throws Exception {
        Object[] parameters = ctx.getParameters();
        String authToken = null;
        if (parameters.length > 0 && parameters[0] instanceof String) {
            authToken = ctx.getParameters()[0].toString();

            String verified = Boolean.FALSE.toString();
            //try {Thread.sleep(1500); } catch (InterruptedException ec){}
            if (authToken != null) {
                try {
                    tokenService.verifyToken(authToken);
                    verified = Boolean.TRUE.toString();
                    if ( tokenService.needRefreshToken(authToken)) {
                        verified += tokenService.regenerateToken(authToken);
                    }
                } catch (Exception ex) {}
            }
            parameters[0] = verified;
            ctx.setParameters(parameters);
        }
        return ctx.proceed();
    }
}
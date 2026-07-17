package pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.interceptors;

import jakarta.interceptor.AroundInvoke;
import jakarta.interceptor.Interceptor;
import jakarta.interceptor.InvocationContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Michał Gnatowski
 * @email michal.gnatowski@atrop.pl
 * @date 14 mar 2022 15:49:30
 */
@Interceptor
@SeparatorLogLine
public class SeparatorLogLineInterceptor {
    @AroundInvoke
    public Object addEmptyLogLine(InvocationContext ctx) throws Exception {
        String className = ctx.getMethod().getDeclaringClass().getName();
        //Logger logger = Logger.getLogger(className);
        Logger LOGGER = LoggerFactory.getLogger(className);
        LOGGER.info("-------------------------------");
        return ctx.proceed();
    }
}

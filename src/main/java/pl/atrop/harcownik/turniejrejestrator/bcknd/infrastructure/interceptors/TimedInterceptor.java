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
 * @date 14 mar 2022 00:10:51
 */
@Interceptor
@Timed
public class TimedInterceptor {
    @AroundInvoke
    public Object timeInvocation(InvocationContext ctx) throws Exception {
        long timeFrom = System.currentTimeMillis();
        String className = ctx.getMethod().getDeclaringClass().getName();
        Logger logger = LoggerFactory.getLogger(className);
        String methodName = ctx.getMethod().getName();

        
        // Before method
        String truncatedParameters = truncateParameters(ctx.getParameters(), 10);
        logger.info("{} - START, parametres:{}", methodName, truncatedParameters);
        //logger.info("{} - START, parametres:{}", methodName, Arrays.toString(ctx.getParameters()));
        Object result = ctx.proceed();

        // after method
        logger.info("{} - END, duration:{}[ms]", methodName, (System.currentTimeMillis()-timeFrom));
        return result;
    }
    
    private String truncateParameters(Object[] parameters, int maxLength) {
        StringBuilder truncated = new StringBuilder("[");
        for (Object parameter : parameters) {
            String strParameter = parameter != null ? parameter.toString() : "null";
            if (strParameter.length() > maxLength) {
                strParameter = strParameter.substring(0, maxLength) + "...";
            }
            truncated.append(strParameter).append(", ");
        }
        if (parameters.length > 0) {
            truncated.setLength(truncated.length() - 2); // Remove the trailing comma and space
        }
        truncated.append("]");
        return truncated.toString();
    }
}

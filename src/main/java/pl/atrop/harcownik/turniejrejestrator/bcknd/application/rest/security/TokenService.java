package pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import jakarta.enterprise.context.ApplicationScoped;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Michał Gnatowski
 * @email michal.gnatowski@atrop.pl
 * @date 24 lut 2022 23:32:09
 */
@ApplicationScoped
public class TokenService {

    private static final Logger LOGGER = LoggerFactory.getLogger(TokenService.class);
    private static final int MAX_SESSION_MIN = 60;//30;
    private static final int NEED_REFRESH_MIN = 30;//30;//5;
    private final String secret = "12se@^$dfg34sf";

    public String generateToken(String username, List<String> customerNames, boolean isTechnius, boolean isAdmin) {
        Algorithm algorithm = Algorithm.HMAC512(secret);
        Date expireDate = new Date(Date.from(Instant.now().plus(MAX_SESSION_MIN, ChronoUnit.MINUTES)).getTime());
        System.out.println("generateToken, expireDate:" + expireDate);
        String generatedToken = JWT.create()
                .withIssuer("Simple Solution")
                .withClaim("username", username)
                //.withClaim("password", password)
                //.withClaim("customerNames", customerNames)
                //.withClaim("technius", isTechnius)
                //.withClaim("admin", isAdmin)
                .withExpiresAt(expireDate)
                .sign(algorithm);
        return generatedToken;
    }
    
    public String generateToken(String username, List<String> roleNames) {
        Algorithm algorithm = Algorithm.HMAC512(secret);
        Date expireDate = new Date(Date.from(Instant.now().plus(MAX_SESSION_MIN, ChronoUnit.MINUTES)).getTime());
        System.out.println("generateToken, expireDate:" + expireDate);
        String generatedToken = JWT.create()
                .withIssuer("Simple Solution")
                .withClaim("username", username)
                //.withClaim("password", password)
                .withClaim("roles", roleNames)
                .withExpiresAt(expireDate)
                .sign(algorithm);
        return generatedToken;
    }

    public String regenerateToken(String token) {
        Algorithm algorithm = Algorithm.HMAC512(secret);

        DecodedJWT decodedJWT = JWT.decode(token);
        Instant expiresAt = decodedJWT.getExpiresAt().toInstant();
        Instant currentInstant = Instant.now();

        String newToken = generateToken(decodedJWT.getClaim("username").asString(),
                decodedJWT.getClaim("roles").asList(String.class));
        return newToken;
    }

    public boolean needRefreshToken(String token) {
        Algorithm algorithm = Algorithm.HMAC512(secret);

        DecodedJWT decodedJWT = JWT.decode(token);
        Instant expiresAt = decodedJWT.getExpiresAt().toInstant();
        Instant currentInstant = Instant.now();

        int remainingMinutes = (int) ChronoUnit.MINUTES.between(currentInstant, expiresAt);
        if (remainingMinutes < NEED_REFRESH_MIN)
            System.out.println("needRefreshToken, remainingMinutes:" + remainingMinutes + ", NEED_REFRESH_MIN:" + NEED_REFRESH_MIN);
        return remainingMinutes < NEED_REFRESH_MIN;
    }

    public void verifyToken(String token) {
        Algorithm algorithm = Algorithm.HMAC512(secret);
        try {
            JWTVerifier verifier = JWT.require(algorithm)
                    .withIssuer("Simple Solution")
                    .acceptExpiresAt(MAX_SESSION_MIN * 60) // 60 seconds = 1 minute
                    .build();
            DecodedJWT decodedJWT = verifier.verify(token);
            Instant expiresAt = decodedJWT.getExpiresAt().toInstant();
            Instant currentInstant = Instant.now();
            int remainingMinutes = (int) ChronoUnit.MINUTES.between(currentInstant, expiresAt);
            if (remainingMinutes < 0) {
                throw new JWTVerificationException("Token has expired. Remaining time: " + remainingMinutes + " minutes.");
            }
            LOGGER.debug("Verify JWT token success, Claims: {}", decodedJWT.getClaims());
        } catch (JWTVerificationException ex) {
            LOGGER.error("Verify JWT token fail: {}", ex.getMessage());
            throw ex;
        }
    }
}

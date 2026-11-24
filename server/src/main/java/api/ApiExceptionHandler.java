package api;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/**
 * Turns bad-request errors from any controller into the same JSON shape the frontend
 * reads, {@code {"error": "..."}}, with a 400 status. Without this, a missing or
 * non-numeric parameter would get Spring's default error page instead.
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    /** A value failed one of the {@link InputValidator} checks. */
    @ExceptionHandler(InvalidInputException.class)
    public ResponseEntity<Map<String, String>> invalidInput(InvalidInputException e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }

    /** A required query parameter wasn't sent, e.g. no threshold. */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<Map<String, String>> missingParameter(MissingServletRequestParameterException e) {
        return ResponseEntity.badRequest()
            .body(Map.of("error", "Missing " + e.getParameterName() + " query parameter."));
    }

    /** A parameter had the wrong type, e.g. threshold=abc. */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, String>> wrongType(MethodArgumentTypeMismatchException e) {
        return ResponseEntity.badRequest()
            .body(Map.of("error", e.getName() + " has an invalid value: " + e.getValue()));
    }
}

package api;

/**
 * Thrown when a request has a bad value (color, threshold, file name or job ID).
 * {@link ApiExceptionHandler} turns it into a 400 response with the message as the error.
 */
public class InvalidInputException extends RuntimeException {
    public InvalidInputException(String message) {
        super(message);
    }
}

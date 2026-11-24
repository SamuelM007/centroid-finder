package api;

import java.io.File;
import java.io.IOException;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Checks request values before the controllers use them.
 *
 * <p>The {@code require...} methods throw {@link InvalidInputException} (which becomes a
 * 400 response) when a value is bad, so the controllers can just call them and move on.
 * The {@code isValid...} methods return true/false for code that only needs a yes or no.
 */
public final class InputValidator {

    /** Folder the videos are read from, relative to where the server is started. */
    public static final String VIDEO_DIR = "videos";

    /** Smallest allowed threshold. 0 matches nothing, but it is a legal value. */
    public static final int MIN_THRESHOLD = 0;

    /** Largest useful threshold: the distance from black to white, sqrt(3 * 255^2) = 441.67. */
    public static final int MAX_THRESHOLD = 441;

    private static final Pattern HEX_COLOR = Pattern.compile("^[0-9A-Fa-f]{6}$");

    /** Allowed video file extensions and the content type each one is sent with. */
    private static final Map<String, String> VIDEO_TYPES = Map.of(
        "mp4", "video/mp4",
        "mov", "video/quicktime",
        "avi", "video/x-msvideo",
        "mkv", "video/x-matroska",
        "webm", "video/webm");

    private static final int MAX_FILE_NAME_LENGTH = 255;

    private InputValidator() {
    }

    // ---------- target color ----------

    /** True for exactly six hex digits with no '#', e.g. "FFA200". */
    public static boolean isValidHexColor(String color) {
        return color != null && HEX_COLOR.matcher(color).matches();
    }

    /** Returns the color in upper case, or throws if it isn't six hex digits. */
    public static String requireHexColor(String color) {
        if (!isValidHexColor(color)) {
            throw new InvalidInputException("targetColor must be 6 hex digits without '#', for example FFA200.");
        }
        return color.toUpperCase(Locale.ROOT);
    }

    // ---------- threshold ----------

    /** True for a whole number from 0 to 441. */
    public static boolean isValidThreshold(Integer threshold) {
        return threshold != null && threshold >= MIN_THRESHOLD && threshold <= MAX_THRESHOLD;
    }

    /** Returns the threshold, or throws if it's outside 0 to 441. */
    public static int requireThreshold(Integer threshold) {
        if (!isValidThreshold(threshold)) {
            throw new InvalidInputException("threshold must be a whole number from " + MIN_THRESHOLD + " to " + MAX_THRESHOLD + ".");
        }
        return threshold;
    }

    // ---------- job ID ----------

    /** True for a UUID in the form the server creates, e.g. "8c2c661b-c4d1-4b40-b833-0ab80402c6fa". */
    public static boolean isValidJobId(String jobId) {
        if (jobId == null) {
            return false;
        }
        try {
            // UUID.fromString accepts some odd forms, so also check it prints back the same
            return UUID.fromString(jobId).toString().equals(jobId.toLowerCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    /** Returns the job ID, or throws if it isn't a UUID. */
    public static String requireJobId(String jobId) {
        if (!isValidJobId(jobId)) {
            throw new InvalidInputException("Invalid job ID: " + jobId);
        }
        return jobId;
    }

    // ---------- video file names ----------

    /** The file's extension in lower case ("mp4"), or "" if it has none. */
    public static String extensionOf(String fileName) {
        int dot = fileName.lastIndexOf('.');
        return dot < 0 ? "" : fileName.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    /** True if the file name has one of the allowed video extensions. */
    public static boolean hasVideoExtension(String fileName) {
        return fileName != null && VIDEO_TYPES.containsKey(extensionOf(fileName));
    }

    /**
     * True for a plain file name with a video extension. Blocks anything that could point
     * outside the videos folder: "..", "/" and "\".
     */
    public static boolean isValidVideoName(String fileName) {
        return fileName != null
            && !fileName.isBlank()
            && fileName.length() <= MAX_FILE_NAME_LENGTH
            && !fileName.contains("..")
            && !fileName.contains("/")
            && !fileName.contains("\\")
            && hasVideoExtension(fileName);
    }

    /**
     * Checks the file name and returns its {@link File} inside the videos folder.
     * Throws if the name is invalid or would resolve outside the folder. The file may not
     * exist yet; the caller decides whether that's a 404.
     */
    public static File requireVideoFile(String fileName) {
        if (!isValidVideoName(fileName)) {
            throw new InvalidInputException("Invalid video file name: " + fileName);
        }
        try {
            File dir = new File(VIDEO_DIR).getCanonicalFile();
            File file = new File(dir, fileName).getCanonicalFile();
            // second line of defense: the resolved path must still be inside videos/
            if (!dir.equals(file.getParentFile())) {
                throw new InvalidInputException("Invalid video file name: " + fileName);
            }
            return file;
        } catch (IOException e) {
            throw new InvalidInputException("Invalid video file name: " + fileName);
        }
    }

    /** The content type to send a video with, based on its extension. */
    public static String videoContentType(String fileName) {
        return VIDEO_TYPES.getOrDefault(extensionOf(fileName), "application/octet-stream");
    }
}

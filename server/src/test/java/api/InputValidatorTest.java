package api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.File;
import java.util.UUID;

import org.junit.jupiter.api.Test;

// Plain unit tests for the validation rules, no Spring needed
public class InputValidatorTest {

    // ---------- target color ----------

    @Test
    void acceptsSixHexDigitsInAnyCase() {
        assertTrue(InputValidator.isValidHexColor("FFA200"));
        assertTrue(InputValidator.isValidHexColor("ffa200"));
        assertTrue(InputValidator.isValidHexColor("000000"));
    }

    @Test
    void rejectsBadColors() {
        for (String color : new String[] {null, "", "FFF", "FFA2000", "#FFA200", "GGGGGG", "FFA 00", "-FFFFF"}) {
            assertFalse(InputValidator.isValidHexColor(color), "should reject " + color);
        }
    }

    @Test
    void requireHexColorReturnsUpperCase() {
        assertEquals("FFA200", InputValidator.requireHexColor("ffa200"));
    }

    @Test
    void requireHexColorThrowsForBadColor() {
        assertThrows(InvalidInputException.class, () -> InputValidator.requireHexColor("red"));
    }

    // ---------- threshold ----------

    @Test
    void acceptsThresholdsFrom0To441() {
        assertTrue(InputValidator.isValidThreshold(0));
        assertTrue(InputValidator.isValidThreshold(164));
        assertTrue(InputValidator.isValidThreshold(441));
    }

    @Test
    void rejectsThresholdsOutOfRange() {
        assertFalse(InputValidator.isValidThreshold(null));
        assertFalse(InputValidator.isValidThreshold(-1));
        assertFalse(InputValidator.isValidThreshold(442));
        assertThrows(InvalidInputException.class, () -> InputValidator.requireThreshold(500));
    }

    // ---------- job ID ----------

    @Test
    void acceptsUuids() {
        String id = UUID.randomUUID().toString();
        assertTrue(InputValidator.isValidJobId(id));
        assertTrue(InputValidator.isValidJobId(id.toUpperCase()));
    }

    @Test
    void rejectsNonUuids() {
        for (String id : new String[] {null, "", "not-a-job", "1-2-3-4-5", "../../etc/passwd"}) {
            assertFalse(InputValidator.isValidJobId(id), "should reject " + id);
        }
        assertThrows(InvalidInputException.class, () -> InputValidator.requireJobId("abc"));
    }

    // ---------- video file names ----------

    @Test
    void acceptsVideoFileNames() {
        for (String name : new String[] {"ensantina.mp4", "Clip 2.MOV", "a.avi", "b.mkv", "c.webm"}) {
            assertTrue(InputValidator.isValidVideoName(name), "should accept " + name);
        }
    }

    @Test
    void rejectsNamesThatCouldLeaveTheFolder() {
        for (String name : new String[] {"../secret.mp4", "..mp4", "a/b.mp4", "a\\b.mp4", "..\\x.mp4"}) {
            assertFalse(InputValidator.isValidVideoName(name), "should reject " + name);
        }
    }

    @Test
    void rejectsNonVideoAndEmptyNames() {
        for (String name : new String[] {null, "", "   ", "notes.txt", "no-extension", ".mp4x", "x".repeat(300) + ".mp4"}) {
            assertFalse(InputValidator.isValidVideoName(name), "should reject " + name);
        }
    }

    @Test
    void requireVideoFileResolvesInsideVideosFolder() throws Exception {
        File file = InputValidator.requireVideoFile("ensantina.mp4");
        assertEquals(new File("videos").getCanonicalFile(), file.getParentFile());
        assertEquals("ensantina.mp4", file.getName());
    }

    @Test
    void requireVideoFileThrowsForBadName() {
        assertThrows(InvalidInputException.class, () -> InputValidator.requireVideoFile("../pom.xml"));
    }

    @Test
    void contentTypeMatchesExtension() {
        assertEquals("video/mp4", InputValidator.videoContentType("a.mp4"));
        assertEquals("video/quicktime", InputValidator.videoContentType("a.MOV"));
        assertEquals("video/webm", InputValidator.videoContentType("a.webm"));
        assertEquals("application/octet-stream", InputValidator.videoContentType("a.txt"));
    }
}

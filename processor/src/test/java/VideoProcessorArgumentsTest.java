import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

public class VideoProcessorArgumentsTest {

    @Test
    public void parsesValidArgumentsTest() {
        VideoProcessorArguments args = new VideoProcessorArguments(
                new String[] { "video.mp4", "out.csv", "4A080C", "60" });

        assertEquals("video.mp4", args.getInputPath());
        assertEquals("out.csv", args.getOutputCsv());
        assertEquals(0x4A080C, args.getTargetColor());
        assertEquals(60, args.getThreshold());
    }

    @Test
    public void lowercaseHexTest() {
        VideoProcessorArguments args = new VideoProcessorArguments(
                new String[] { "video.mp4", "out.csv", "ff00aa", "10" });

        assertEquals(0xFF00AA, args.getTargetColor());
    }

    @Test
    public void tooFewArgumentsTest() {
        assertThrows(IllegalArgumentException.class,
                () -> new VideoProcessorArguments(new String[] { "video.mp4", "out.csv", "4A080C" }));
    }

    @Test
    public void noArgumentsTest() {
        assertThrows(IllegalArgumentException.class,
                () -> new VideoProcessorArguments(new String[] {}));
    }

    @Test
    public void invalidHexColorTest() {
        assertThrows(IllegalArgumentException.class,
                () -> new VideoProcessorArguments(new String[] { "video.mp4", "out.csv", "ZZZZZZ", "60" }));
    }

    @Test
    public void nonIntegerThresholdTest() {
        assertThrows(IllegalArgumentException.class,
                () -> new VideoProcessorArguments(new String[] { "video.mp4", "out.csv", "4A080C", "abc" }));
    }
}

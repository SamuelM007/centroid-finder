import static org.junit.jupiter.api.Assertions.assertTrue;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.nio.file.Path;

import org.bytedeco.ffmpeg.global.avcodec;
import org.bytedeco.javacv.FFmpegFrameRecorder;
import org.bytedeco.javacv.Java2DFrameConverter;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

public class VideoProcessorAppTest {

    @TempDir
    Path tempDir;

    private final PrintStream originalOut = System.out;
    private final ByteArrayOutputStream capturedOut = new ByteArrayOutputStream();

    @BeforeEach
    public void captureOutput() {
        System.setOut(new PrintStream(capturedOut));
    }

    @AfterEach
    public void restoreOutput() {
        System.setOut(originalOut);
    }

    /**
     * Writes a small test mp4 with the given number of frames.
     * Each frame is a solid color so the video is valid but tiny.
     */
    private String makeTestVideo(int frames, int width, int height, double frameRate) throws Exception {
        String path = tempDir.resolve("test.mp4").toString();

        try (FFmpegFrameRecorder recorder = new FFmpegFrameRecorder(path, width, height);
             Java2DFrameConverter converter = new Java2DFrameConverter()) {
            recorder.setFormat("mp4");
            recorder.setVideoCodec(avcodec.AV_CODEC_ID_MPEG4);
            recorder.setFrameRate(frameRate);
            recorder.start();

            for (int i = 0; i < frames; i++) {
                BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_3BYTE_BGR);
                Graphics2D g = image.createGraphics();
                g.setColor(new Color(i * 5 % 256, 100, 200));
                g.fillRect(0, 0, width, height);
                g.dispose();
                recorder.record(converter.convert(image));
            }

            recorder.stop();
        }

        return path;
    }

    @Test
    public void countsAllFramesTest() throws Exception {
        String video = makeTestVideo(30, 64, 48, 10);

        VideoProcessorApp.main(new String[] { video });

        String output = capturedOut.toString();
        assertTrue(output.contains("Counted frames: 30"), output);
    }

    @Test
    public void reportsDimensionsTest() throws Exception {
        String video = makeTestVideo(5, 64, 48, 10);

        VideoProcessorApp.main(new String[] { video });

        String output = capturedOut.toString();
        assertTrue(output.contains("Width: 64"), output);
        assertTrue(output.contains("Height: 48"), output);
    }

    @Test
    public void lastTimestampMatchesFrameRateTest() throws Exception {
        // 20 frames at 10 fps -> last frame starts at 1.9 seconds
        String video = makeTestVideo(20, 64, 48, 10);

        VideoProcessorApp.main(new String[] { video });

        String output = capturedOut.toString();
        assertTrue(output.contains("Last frame timestamp (s): 1.9"), output);
    }

    @Test
    public void noArgsPrintsUsageTest() {
        VideoProcessorApp.main(new String[] {});

        String output = capturedOut.toString();
        assertTrue(output.contains("Usage"), output);
    }
}

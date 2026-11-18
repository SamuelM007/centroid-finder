import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

import org.bytedeco.ffmpeg.global.avcodec;
import org.bytedeco.javacv.FFmpegFrameGrabber;
import org.bytedeco.javacv.FFmpegFrameRecorder;
import org.bytedeco.javacv.Frame;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

/**
 * Checks the CSV output on the first minute of the real salamander video.
 *
 * The video is not committed to the repo, so these tests are skipped if
 * sampleInput/ensantina.mp4 is not there (for example, in GitHub CI).
 *
 * Expected values come from checking the first frame by hand: the salamander
 * starts at about (219, 422), and in the first minute it walks smoothly
 * to the bottom-left corner (about (43, 595) at 30 seconds).
 */
public class VideoCsvOutputTest {

    private static final Path VIDEO = Path.of("sampleInput", "ensantina.mp4");
    private static final String COLOR = "4A080C";
    private static final String THRESHOLD = "60";
    private static final int WIDTH = 816;
    private static final int HEIGHT = 720;
    private static final double FRAME_RATE = 24000.0 / 1001.0; // 23.976 fps

    @TempDir
    static Path tempDir;

    private static List<Double> seconds = new ArrayList<>();
    private static List<Integer> xs = new ArrayList<>();
    private static List<Integer> ys = new ArrayList<>();

    /**
     * Copies the first 60 seconds of the video into a temp clip, runs the app on it,
     * and reads the CSV back. Done once for all the tests in this class.
     */
    @BeforeAll
    public static void runOnFirstMinute() throws Exception {
        assumeTrue(Files.exists(VIDEO), "Salamander video not found, skipping");

        Path clip = tempDir.resolve("firstMinute.mp4");
        try (FFmpegFrameGrabber grabber = new FFmpegFrameGrabber(VIDEO.toString())) {
            grabber.start();
            try (FFmpegFrameRecorder recorder = new FFmpegFrameRecorder(
                    clip.toString(), grabber.getImageWidth(), grabber.getImageHeight())) {
                recorder.setFormat("mp4");
                recorder.setVideoCodec(avcodec.AV_CODEC_ID_MPEG4);
                recorder.setFrameRate(grabber.getFrameRate());
                recorder.setVideoQuality(1); // best quality so colors stay close to the original
                recorder.start();

                Frame frame;
                while ((frame = grabber.grabImage()) != null && frame.timestamp < 60_000_000L) {
                    recorder.record(frame);
                }

                recorder.stop();
            }
            grabber.stop();
        }

        Path csv = tempDir.resolve("output.csv");
        VideoProcessorApp.main(new String[] { clip.toString(), csv.toString(), COLOR, THRESHOLD });

        for (String line : Files.readAllLines(csv)) {
            String[] parts = line.split(",");
            assertEquals(3, parts.length, "Bad CSV row: " + line);
            seconds.add(Double.parseDouble(parts[0]));
            xs.add(Integer.parseInt(parts[1]));
            ys.add(Integer.parseInt(parts[2]));
        }
    }

    @Test
    public void oneRowPerFrameTest() {
        // 60 seconds at 23.976 fps -> about 1439 frames
        int expected = (int) Math.round(60 * FRAME_RATE);
        assertEquals(expected, seconds.size(), 2);
    }

    @Test
    public void timestampsStartAtZeroAndGoUpOneFrameAtATimeTest() {
        assertEquals(0.0, seconds.get(0), 0.001);
        for (int i = 1; i < seconds.size(); i++) {
            double step = seconds.get(i) - seconds.get(i - 1);
            assertEquals(1.0 / FRAME_RATE, step, 0.002, "Bad timestamp step at row " + i);
        }
    }

    @Test
    public void lastTimestampIsUnderOneMinuteTest() {
        double last = seconds.get(seconds.size() - 1);
        assertTrue(last < 60.0 && last > 59.9, "Last timestamp was " + last);
    }

    @Test
    public void salamanderFoundInEveryFrameTest() {
        // In the first minute the salamander is always visible, so no -1,-1 rows
        for (int i = 0; i < xs.size(); i++) {
            assertTrue(xs.get(i) >= 0 && xs.get(i) < WIDTH, "x out of frame at row " + i + ": " + xs.get(i));
            assertTrue(ys.get(i) >= 0 && ys.get(i) < HEIGHT, "y out of frame at row " + i + ": " + ys.get(i));
        }
    }

    @Test
    public void firstFrameMatchesSalamanderTest() {
        assertEquals(219, xs.get(0), 3);
        assertEquals(422, ys.get(0), 3);
    }

    @Test
    public void thirtySecondsMatchesSalamanderTest() {
        int row = (int) Math.round(30 * FRAME_RATE);
        assertEquals(43, xs.get(row), 5);
        assertEquals(595, ys.get(row), 5);
    }

    @Test
    public void noBigJumpsTest() {
        // The salamander only moves a few pixels per frame.
        // A big jump would mean the tracker switched to something else.
        for (int i = 1; i < xs.size(); i++) {
            int jump = Math.abs(xs.get(i) - xs.get(i - 1)) + Math.abs(ys.get(i) - ys.get(i - 1));
            assertTrue(jump < 30, "Jump of " + jump + " pixels at " + seconds.get(i) + "s");
        }
    }
}

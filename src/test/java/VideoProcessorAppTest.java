import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

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
     * Writes a small 64x48 test mp4 at 10 fps with the given number of frames.
     * Each frame is white with a black square of the given size at (squareX, squareY).
     * A squareSize of 0 means no square (all white).
     */
    private String makeTestVideo(int frames, int squareX, int squareY, int squareSize) throws Exception {
        String path = tempDir.resolve("test.mp4").toString();
        int width = 64;
        int height = 48;

        try (FFmpegFrameRecorder recorder = new FFmpegFrameRecorder(path, width, height);
             Java2DFrameConverter converter = new Java2DFrameConverter()) {
            recorder.setFormat("mp4");
            recorder.setVideoCodec(avcodec.AV_CODEC_ID_MPEG4);
            recorder.setFrameRate(10);
            recorder.setVideoQuality(1); // best quality so the square edges stay sharp
            recorder.start();

            for (int i = 0; i < frames; i++) {
                BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_3BYTE_BGR);
                Graphics2D g = image.createGraphics();
                g.setColor(Color.WHITE);
                g.fillRect(0, 0, width, height);
                if (squareSize > 0) {
                    g.setColor(Color.BLACK);
                    g.fillRect(squareX, squareY, squareSize, squareSize);
                }
                g.dispose();
                recorder.record(converter.convert(image));
            }

            recorder.stop();
        }

        return path;
    }

    /**
     * Runs the app on the video with the given color and threshold,
     * writing to a CSV in the temp folder.
     */
    private void runApp(String video, String color, String threshold) {
        String csv = tempDir.resolve("output.csv").toString();
        VideoProcessorApp.main(new String[] { video, csv, color, threshold });
    }

    /**
     * Returns the "seconds,x,y" rows from the output CSV, split into parts.
     */
    private List<String[]> getRows() throws Exception {
        List<String[]> rows = new ArrayList<>();
        for (String line : Files.readAllLines(tempDir.resolve("output.csv"))) {
            String[] parts = line.trim().split(",");
            if (parts.length == 3) {
                rows.add(parts);
            }
        }
        return rows;
    }

    @Test
    public void tracksSquareCentroidTest() throws Exception {
        // 10x10 square at (20, 10) -> pixels x 20..29, y 10..19 -> centroid (24, 14)
        String video = makeTestVideo(5, 20, 10, 10);

        runApp(video, "000000", "100");

        List<String[]> rows = getRows();
        assertEquals(5, rows.size());
        for (String[] row : rows) {
            assertEquals(24, Integer.parseInt(row[1]), 1);
            assertEquals(14, Integer.parseInt(row[2]), 1);
        }
    }

    @Test
    public void noGroupPrintsNegativeOneTest() throws Exception {
        // All white video, looking for black -> no groups
        String video = makeTestVideo(3, 0, 0, 0);

        runApp(video, "000000", "100");

        List<String[]> rows = getRows();
        assertEquals(3, rows.size());
        for (String[] row : rows) {
            assertEquals("-1", row[1]);
            assertEquals("-1", row[2]);
        }
    }

    @Test
    public void tracksEveryFrameTest() throws Exception {
        String video = makeTestVideo(15, 20, 10, 10);

        runApp(video, "000000", "100");

        assertEquals(15, getRows().size());
    }

    @Test
    public void timestampsMatchFrameRateTest() throws Exception {
        // 10 fps -> rows at 0.0, 0.1, 0.2, ...
        String video = makeTestVideo(5, 20, 10, 10);

        runApp(video, "000000", "100");

        List<String[]> rows = getRows();
        for (int i = 0; i < rows.size(); i++) {
            assertEquals(i * 0.1, Double.parseDouble(rows.get(i)[0]), 0.001);
        }
    }

    @Test
    public void noArgsPrintsUsageTest() {
        VideoProcessorApp.main(new String[] {});

        String output = capturedOut.toString();
        assertTrue(output.contains("Usage"), output);
    }
}

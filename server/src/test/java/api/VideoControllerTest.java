package api;

import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.nio.file.Files;
import java.nio.file.Path;

import org.bytedeco.ffmpeg.global.avcodec;
import org.bytedeco.javacv.FFmpegFrameRecorder;
import org.bytedeco.javacv.Java2DFrameConverter;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Tests every route in {@link VideoController} plus {@code /api/health}.
 *
 * Runs against a separate test database and creates its own test videos in
 * {@code videos/}, which are deleted after the tests finish.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "spring.datasource.url=jdbc:sqlite:target/test-jobs.db")
public class VideoControllerTest {

    private static final String TEST_VIDEO = "junit-test-video.mp4";
    private static final Path TEST_VIDEO_PATH = Path.of("videos", TEST_VIDEO);

    // a file with a video name that isn't actually a video
    private static final String FAKE_VIDEO = "junit-fake-video.mp4";
    private static final Path FAKE_VIDEO_PATH = Path.of("videos", FAKE_VIDEO);

    @Autowired
    private MockMvc mvc;

    /**
     * Writes a small real mp4 into {@code videos/} so the video and thumbnail routes have something
     * to read, plus a fake {@code .mp4} that isn't really a video.
     *
     * @throws Exception if the test files can't be written
     */
    @BeforeAll
    static void makeTestVideo() throws Exception {
        Files.createDirectories(TEST_VIDEO_PATH.getParent());
        int width = 64;
        int height = 48;
        try (FFmpegFrameRecorder recorder = new FFmpegFrameRecorder(TEST_VIDEO_PATH.toString(), width, height);
             Java2DFrameConverter converter = new Java2DFrameConverter()) {
            recorder.setFormat("mp4");
            recorder.setVideoCodec(avcodec.AV_CODEC_ID_MPEG4);
            recorder.setFrameRate(10);
            recorder.start();
            for (int i = 0; i < 5; i++) {
                BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_3BYTE_BGR);
                Graphics2D g = image.createGraphics();
                g.setColor(Color.WHITE);
                g.fillRect(0, 0, width, height);
                g.dispose();
                recorder.record(converter.convert(image));
            }
            recorder.stop();
        }
        Files.writeString(FAKE_VIDEO_PATH, "not a real video");
    }

    /**
     * Deletes the test videos created in {@link #makeTestVideo()}.
     *
     * @throws Exception if a test file can't be deleted
     */
    @AfterAll
    static void deleteTestVideo() throws Exception {
        Files.deleteIfExists(TEST_VIDEO_PATH);
        Files.deleteIfExists(FAKE_VIDEO_PATH);
    }

    // GET /api/health

    /**
     * The health route returns 200 and the running message.
     */
    @Test
    void healthReturnsRunning() throws Exception {
        mvc.perform(get("/api/health"))
            .andExpect(status().isOk())
            .andExpect(content().string("Server is Running!"));
    }

    // GET /api/videos

    /**
     * The video list includes the test video.
     */
    @Test
    void getAllVideosIncludesTestVideo() throws Exception {
        mvc.perform(get("/api/videos"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasItem(TEST_VIDEO)));
    }

    // GET /api/video/{fileName}

    /**
     * An existing video is returned as {@code video/mp4}.
     */
    @Test
    void getVideoReturnsMp4() throws Exception {
        mvc.perform(get("/api/video/" + TEST_VIDEO))
            .andExpect(status().isOk())
            .andExpect(content().contentType("video/mp4"));
    }

    /**
     * A video that doesn't exist returns 404.
     */
    @Test
    void getVideoUnknownFileReturns404() throws Exception {
        mvc.perform(get("/api/video/does-not-exist.mp4"))
            .andExpect(status().isNotFound());
    }

    // GET /api/thumbnail/{fileName}

    /**
     * The thumbnail of a real video is returned as a JPEG.
     */
    @Test
    void getThumbnailReturnsJpeg() throws Exception {
        mvc.perform(get("/api/thumbnail/" + TEST_VIDEO))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.IMAGE_JPEG));
    }

    /**
     * The thumbnail of a video that doesn't exist returns 404.
     */
    @Test
    void getThumbnailUnknownFileReturns404() throws Exception {
        mvc.perform(get("/api/thumbnail/does-not-exist.mp4"))
            .andExpect(status().isNotFound());
    }

    /**
     * The thumbnail of a file that isn't a real video returns 500 with an error message.
     */
    @Test
    void getThumbnailNotAVideoReturns500() throws Exception {
        mvc.perform(get("/api/thumbnail/" + FAKE_VIDEO))
            .andExpect(status().isInternalServerError())
            .andExpect(jsonPath("$.error").value("Error generating thumbnail"));
    }

    // unknown routes

    /**
     * A route that doesn't exist returns 404.
     */
    @Test
    void unknownRouteReturns404() throws Exception {
        mvc.perform(get("/api/not-a-route"))
            .andExpect(status().isNotFound());
    }
}

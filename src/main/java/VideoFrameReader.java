import java.io.IOException;

import org.bytedeco.ffmpeg.global.avutil;
import org.bytedeco.javacv.FFmpegFrameGrabber;
import org.bytedeco.javacv.Frame;
import org.bytedeco.javacv.Java2DFrameConverter;

/**
 * Reads the frames of a video file one at a time using JavaCV.
 *
 * Each frame is returned as a BufferedImage (so the existing centroid finder classes
 * can use it) along with its timestamp in seconds.
 * This is the only class that uses JavaCV.
 */
public class VideoFrameReader implements AutoCloseable {
    private final FFmpegFrameGrabber grabber;
    private final Java2DFrameConverter converter;

    /**
     * Opens the video at the given path.
     *
     * @param inputPath path to the video file
     * @throws IOException if the video could not be opened
     */
    public VideoFrameReader(String inputPath) throws IOException {
        // Only show FFmpeg errors (hides the per-frame swscaler warnings)
        avutil.av_log_set_level(avutil.AV_LOG_ERROR);

        grabber = new FFmpegFrameGrabber(inputPath);
        converter = new Java2DFrameConverter();
        grabber.start();
    }

    /**
     * Returns the next video frame with its timestamp.
     *
     * Note: the converter reuses the same BufferedImage for every frame,
     * so each frame should be used before calling nextFrame() again.
     *
     * @return the next frame, or null at the end of the video
     * @throws IOException if the frame could not be read
     */
    public TimestampedFrame nextFrame() throws IOException {
        // grabImage() only returns video frames (skips audio), null at end of video
        Frame frame = grabber.grabImage();
        if (frame == null) {
            return null;
        }

        double seconds = frame.timestamp / 1_000_000.0; // microseconds -> seconds
        // JavaCV Frame -> BufferedImage so the old code can use it
        return new TimestampedFrame(seconds, converter.convert(frame));
    }

    /**
     * Stops and closes the video.
     *
     * @throws IOException if the video could not be closed
     */
    @Override
    public void close() throws IOException {
        grabber.close(); // also stops the grabber
        converter.close();
    }
}

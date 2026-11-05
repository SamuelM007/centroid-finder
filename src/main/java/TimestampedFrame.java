import java.awt.image.BufferedImage;

/**
 * One frame of a video and the time it appears, in seconds since the start of the video.
 */
public record TimestampedFrame(double seconds, BufferedImage image) {}

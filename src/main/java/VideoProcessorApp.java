import org.bytedeco.javacv.FFmpegFrameGrabber;
import org.bytedeco.javacv.Frame;

/**
 * The Video Processor Application.
 *
 * For now this just opens an mp4 with JavaCV and counts its video frames.
 *
 * Usage:
 *   java VideoProcessorApp <input_video>
 */
public class VideoProcessorApp {
    public static void main(String[] args) {
        if (args.length < 1) {
            System.out.println("Usage: java VideoProcessorApp <input_video>");
            return;
        }

        String inputPath = args[0];

        try (FFmpegFrameGrabber grabber = new FFmpegFrameGrabber(inputPath)) {
            grabber.start();

            System.out.println("Width: " + grabber.getImageWidth());
            System.out.println("Height: " + grabber.getImageHeight());
            System.out.println("Frame rate: " + grabber.getFrameRate());
            System.out.println("Reported length (frames): " + grabber.getLengthInFrames());

            int frameCount = 0;
            double lastSeconds = 0;
            Frame frame;
            // grabImage() only returns video frames (skips audio), null at end of video
            while ((frame = grabber.grabImage()) != null) {
                frameCount++;
                lastSeconds = frame.timestamp / 1_000_000.0; // microseconds -> seconds
            }

            grabber.stop();

            System.out.println("Counted frames: " + frameCount);
            System.out.println("Last frame timestamp (s): " + lastSeconds);
        } catch (Exception e) {
            System.err.println("Error reading video: " + inputPath);
            e.printStackTrace();
        }
    }
}

import java.awt.image.BufferedImage;
import java.io.File;
import javax.imageio.ImageIO;

import org.bytedeco.javacv.FFmpegFrameGrabber;
import org.bytedeco.javacv.Frame;
import org.bytedeco.javacv.Java2DFrameConverter;

/**
 * The Video Processor Application.
 *
 * For now this opens an mp4 with JavaCV and counts its video frames.
 * If a target color and threshold are given, the first frame is binarized
 * with the existing DistanceImageBinarizer and saved as "firstFrameBinarized.png".
 *
 * Usage:
 *   java VideoProcessorApp <input_video> [hex_target_color threshold]
 */
public class VideoProcessorApp {
    public static void main(String[] args) {
        if (args.length < 1) {
            System.out.println("Usage: java VideoProcessorApp <input_video> [hex_target_color threshold]");
            return;
        }

        String inputPath = args[0];

        // Optional: target color and threshold for binarizing the first frame
        ImageBinarizer binarizer = null;
        if (args.length >= 3) {
            int targetColor = 0;
            try {
                targetColor = Integer.parseInt(args[1], 16);
            } catch (NumberFormatException e) {
                System.err.println("Invalid hex target color. Please provide a color in RRGGBB format.");
                return;
            }

            int threshold = 0;
            try {
                threshold = Integer.parseInt(args[2]);
            } catch (NumberFormatException e) {
                System.err.println("Threshold must be an integer.");
                return;
            }

            ColorDistanceFinder distanceFinder = new EuclideanColorDistance();
            binarizer = new DistanceImageBinarizer(distanceFinder, targetColor, threshold);
        }

        try (FFmpegFrameGrabber grabber = new FFmpegFrameGrabber(inputPath);
             Java2DFrameConverter converter = new Java2DFrameConverter()) {
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
                if (frameCount == 0 && binarizer != null) {
                    // JavaCV Frame -> BufferedImage so the old code can use it
                    BufferedImage image = converter.convert(frame);

                    int[][] binaryArray = binarizer.toBinaryArray(image);
                    BufferedImage binaryImage = binarizer.toBufferedImage(binaryArray);

                    ImageIO.write(binaryImage, "png", new File("firstFrameBinarized.png"));
                    System.out.println("First frame binarized image saved as firstFrameBinarized.png");
                }

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

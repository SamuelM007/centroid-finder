import java.awt.image.BufferedImage;
import java.io.File;
import java.util.List;
import javax.imageio.ImageIO;

import org.bytedeco.ffmpeg.global.avutil;
import org.bytedeco.javacv.FFmpegFrameGrabber;
import org.bytedeco.javacv.Frame;
import org.bytedeco.javacv.Java2DFrameConverter;

/**
 * The Video Processor Application.
 *
 * For now this opens an mp4 with JavaCV and counts its video frames.
 * If a target color and threshold are given, the first frame is binarized
 * with the existing DistanceImageBinarizer and saved as "firstFrameBinarized.png",
 * and the largest centroid of the first 10 frames is printed as "seconds,x,y"
 * (or "seconds,-1,-1" if no group is found).
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

        // Reuse the existing group finder to track the largest centroid
        ImageGroupFinder groupFinder = null;
        if (binarizer != null) {
            groupFinder = new BinarizingImageGroupFinder(binarizer, new DfsBinaryGroupFinder());
        }
        int framesToTrack = 10;

        // Only show FFmpeg errors (hides the per-frame swscaler warnings)
        avutil.av_log_set_level(avutil.AV_LOG_ERROR);

        try (FFmpegFrameGrabber grabber = new FFmpegFrameGrabber(inputPath);
             Java2DFrameConverter converter = new Java2DFrameConverter()) {
            grabber.start();

            int frameCount = 0;
            Frame frame;
            // grabImage() only returns video frames (skips audio), null at end of video
            while ((frame = grabber.grabImage()) != null) {
                if (frameCount == 0 && binarizer != null) {
                    // JavaCV Frame -> BufferedImage so the old code can use it
                    BufferedImage image = converter.convert(frame);

                    int[][] binaryArray = binarizer.toBinaryArray(image);
                    BufferedImage binaryImage = binarizer.toBufferedImage(binaryArray);

                    ImageIO.write(binaryImage, "png", new File("firstFrameBinarized.png"));
                }

                if (frameCount < framesToTrack && groupFinder != null) {
                    BufferedImage image = converter.convert(frame);
                    double seconds = frame.timestamp / 1_000_000.0;

                    // Groups are sorted descending, so the first one is the largest
                    List<Group> groups = groupFinder.findConnectedGroups(image);
                    int x = -1;
                    int y = -1;
                    if (!groups.isEmpty()) {
                        x = groups.get(0).centroid().x();
                        y = groups.get(0).centroid().y();
                    }

                    System.out.println(seconds + "," + x + "," + y);
                }

                frameCount++;
            }

            grabber.stop();
        } catch (Exception e) {
            System.err.println("Error reading video: " + inputPath);
            e.printStackTrace();
        }
    }
}

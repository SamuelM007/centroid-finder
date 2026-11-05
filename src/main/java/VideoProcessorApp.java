import java.awt.image.BufferedImage;
import java.io.File;
import java.io.PrintWriter;
import java.util.List;
import javax.imageio.ImageIO;

import org.bytedeco.ffmpeg.global.avutil;
import org.bytedeco.javacv.FFmpegFrameGrabber;
import org.bytedeco.javacv.Frame;
import org.bytedeco.javacv.Java2DFrameConverter;

/**
 * The Video Processor Application.
 *
 * This application takes four command-line arguments:
 * 1. The path to an input video file (for example, "video.mp4").
 * 2. The path to the output CSV file (for example, "output.csv").
 * 3. A target hex color in the format RRGGBB (for example, "FF0000" for red).
 * 4. An integer threshold for binarization.
 *
 * Every frame of the video is run through the existing BinarizingImageGroupFinder.
 * For each frame, a CSV row "seconds,x,y" is written with the centroid of the
 * largest group, or "seconds,-1,-1" if no group is found.
 * The first frame is also binarized and saved as "firstFrameBinarized.png".
 *
 * Usage:
 *   java VideoProcessorApp <input_video> <output_csv> <hex_target_color> <threshold>
 */
public class VideoProcessorApp {
    public static void main(String[] args) {
        if (args.length < 4) {
            System.out.println("Usage: java VideoProcessorApp <input_video> <output_csv> <hex_target_color> <threshold>");
            return;
        }

        VideoProcessorArguments arguments = null;
        try {
            arguments = VideoProcessorArguments.parse(args);
        } catch (IllegalArgumentException e) {
            System.err.println(e.getMessage());
            return;
        }

        String inputPath = arguments.inputPath();
        String outputCsv = arguments.outputCsv();
        int targetColor = arguments.targetColor();
        int threshold = arguments.threshold();

        ColorDistanceFinder distanceFinder = new EuclideanColorDistance();
        ImageBinarizer binarizer = new DistanceImageBinarizer(distanceFinder, targetColor, threshold);

        // Reuse the existing group finder to track the largest centroid
        ImageGroupFinder groupFinder = new BinarizingImageGroupFinder(binarizer, new DfsBinaryGroupFinder());

        // Only show FFmpeg errors (hides the per-frame swscaler warnings)
        avutil.av_log_set_level(avutil.AV_LOG_ERROR);

        try (FFmpegFrameGrabber grabber = new FFmpegFrameGrabber(inputPath);
             Java2DFrameConverter converter = new Java2DFrameConverter();
             PrintWriter writer = new PrintWriter(outputCsv)) {
            grabber.start();

            int frameCount = 0;
            Frame frame;
            // grabImage() only returns video frames (skips audio), null at end of video
            while ((frame = grabber.grabImage()) != null) {
                // JavaCV Frame -> BufferedImage so the old code can use it
                BufferedImage image = converter.convert(frame);
                double seconds = frame.timestamp / 1_000_000.0; // microseconds -> seconds

                if (frameCount == 0) {
                    int[][] binaryArray = binarizer.toBinaryArray(image);
                    BufferedImage binaryImage = binarizer.toBufferedImage(binaryArray);

                    ImageIO.write(binaryImage, "png", new File("firstFrameBinarized.png"));
                }

                // Groups are sorted descending, so the first one is the largest
                List<Group> groups = groupFinder.findConnectedGroups(image);
                int x = -1;
                int y = -1;
                if (!groups.isEmpty()) {
                    x = groups.get(0).centroid().x();
                    y = groups.get(0).centroid().y();
                }

                writer.println(seconds + "," + x + "," + y);

                frameCount++;
            }

            grabber.stop();
        } catch (Exception e) {
            System.err.println("Error processing video: " + inputPath);
            e.printStackTrace();
        }
    }
}

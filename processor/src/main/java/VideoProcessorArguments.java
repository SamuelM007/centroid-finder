/**
 * Parses and holds the command-line arguments for the video processor.
 *
 * Expected arguments, in order:
 * 1. inputPath   - path to the input video
 * 2. outputCsv   - path to write the CSV
 * 3. targetColor - hex color in RRGGBB format (for example, "FF0000")
 * 4. threshold   - integer threshold for binarization
 */
public class VideoProcessorArguments {
    private final String inputPath;
    private final String outputCsv;
    private final int targetColor;
    private final int threshold;

    /**
     * Parses the command-line arguments.
     *
     * @param args the raw command-line arguments
     * @throws IllegalArgumentException if there are fewer than 4 arguments, the color is not valid hex,
     *         or the threshold is not an integer
     */
    public VideoProcessorArguments(String[] args) {
        if (args.length < 4) {
            throw new IllegalArgumentException("Usage: java VideoProcessorApp <input_video> <output_csv> <hex_target_color> <threshold>");
        }

        inputPath = args[0];
        outputCsv = args[1];

        try {
            targetColor = Integer.parseInt(args[2], 16);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid hex target color. Please provide a color in RRGGBB format.");
        }

        try {
            threshold = Integer.parseInt(args[3]);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Threshold must be an integer.");
        }
    }

    public String getInputPath() {
        return inputPath;
    }

    public String getOutputCsv() {
        return outputCsv;
    }

    public int getTargetColor() {
        return targetColor;
    }

    public int getThreshold() {
        return threshold;
    }
}

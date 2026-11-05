/**
 * Holds the parsed command-line arguments for the video processor.
 *
 * Expected arguments, in order:
 * 1. inputPath   - path to the input video
 * 2. outputCsv   - path to write the CSV
 * 3. targetColor - hex color in RRGGBB format (for example, "FF0000")
 * 4. threshold   - integer threshold for binarization
 */
public record VideoProcessorArguments(String inputPath, String outputCsv, int targetColor, int threshold) {

    /**
     * Parses the command-line arguments.
     *
     * @param args the raw command-line arguments
     * @return the parsed arguments
     * @throws IllegalArgumentException if there are fewer than 4 arguments, the color is not valid hex,
     *         or the threshold is not an integer
     */
    public static VideoProcessorArguments parse(String[] args) {
        if (args.length < 4) {
            throw new IllegalArgumentException("Usage: java VideoProcessorApp <input_video> <output_csv> <hex_target_color> <threshold>");
        }

        String inputPath = args[0];
        String outputCsv = args[1];

        int targetColor = 0;
        try {
            targetColor = Integer.parseInt(args[2], 16);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid hex target color. Please provide a color in RRGGBB format.");
        }

        int threshold = 0;
        try {
            threshold = Integer.parseInt(args[3]);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Threshold must be an integer.");
        }

        return new VideoProcessorArguments(inputPath, outputCsv, targetColor, threshold);
    }
}

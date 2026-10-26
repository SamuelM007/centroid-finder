import static org.junit.jupiter.api.Assertions.assertEquals;

import java.awt.image.BufferedImage;

import org.junit.jupiter.api.Test;

public class DistanceImageBinarizerTest {

    private static class FakeDistanceFinder implements ColorDistanceFinder {
        @Override
        public double distance(int colorA, int colorB) {
            return 0;
        }
    }

    private static final int WHITE = 0xFFFFFFFF; // getRGB includes alpha (FF = opaque)
    private static final int BLACK = 0xFF000000;

    @Test
    public void toBufferedImageHasCorrectDimensionsTest() {
        DistanceImageBinarizer binarizer = new DistanceImageBinarizer(new FakeDistanceFinder(), 0x000000, 10);
        int[][] binary = {
            {1, 0, 1},
            {0, 1, 0}
        }; 
        BufferedImage result = binarizer.toBufferedImage(binary);

        assertEquals(3, result.getWidth());
        assertEquals(2, result.getHeight());
    }

    @Test
    public void toBufferedImageMapsOnesToWhiteAndZerosToBlackTest() {
        DistanceImageBinarizer binarizer = new DistanceImageBinarizer(new FakeDistanceFinder(), 0x000000, 10);
        int[][] binary = {
            {1, 0, 0},
            {0, 0, 1}
        };

        BufferedImage result = binarizer.toBufferedImage(binary);

       
        assertEquals(WHITE, result.getRGB(0, 0)); // binary[0][0]
        assertEquals(BLACK, result.getRGB(1, 0)); // binary[0][1]
        assertEquals(BLACK, result.getRGB(0, 1)); // binary[1][0]
        assertEquals(WHITE, result.getRGB(2, 1)); // binary[1][2]
    }

    @Test
    public void toBufferedImageAllBlackTest() {
        DistanceImageBinarizer binarizer = new DistanceImageBinarizer(new FakeDistanceFinder(), 0x000000, 10);
        int[][] binary = {
            {0, 0},
            {0, 0}
        };

        BufferedImage result = binarizer.toBufferedImage(binary);

        for (int y = 0; y < 2; y++) {
            for (int x = 0; x < 2; x++) {
                assertEquals(BLACK, result.getRGB(x, y));
            }
        }
    }

    // A fake that returns 0 when the colors match exactly and 1000 otherwise.
    // This makes it easy to control which pixels should come out white.
    private static class ExactMatchDistanceFinder implements ColorDistanceFinder {
        @Override
        public double distance(int colorA, int colorB) {
            return colorA == colorB ? 0 : 1000;
        }
    }

    // A fake that remembers the colors it was called with.
    private static class RecordingDistanceFinder implements ColorDistanceFinder {
        int lastColorA;
        int lastColorB;

        @Override
        public double distance(int colorA, int colorB) {
            lastColorA = colorA;
            lastColorB = colorB;
            return 0;
        }
    }

    @Test
    public void toBinaryArrayHasCorrectDimensionsTest() {
        DistanceImageBinarizer binarizer = new DistanceImageBinarizer(new ExactMatchDistanceFinder(), 0xFF0000, 10);
        BufferedImage img = new BufferedImage(3, 2, BufferedImage.TYPE_INT_RGB); // width 3, height 2

        int[][] result = binarizer.toBinaryArray(img);

        assertEquals(2, result.length);    // rows = height
        assertEquals(3, result[0].length); // columns = width
    }

    @Test
    public void toBinaryArrayTargetColorBecomesWhiteTest() {
        DistanceImageBinarizer binarizer = new DistanceImageBinarizer(new ExactMatchDistanceFinder(), 0xFF0000, 10);
        BufferedImage img = new BufferedImage(3, 2, BufferedImage.TYPE_INT_RGB);
        img.setRGB(0, 0, 0xFF0000); // matches target
        img.setRGB(2, 1, 0xFF0000); // matches target
        img.setRGB(1, 0, 0x00FF00); // does not match

        int[][] result = binarizer.toBinaryArray(img);

        assertEquals(1, result[0][0]);
        assertEquals(0, result[0][1]);
        assertEquals(0, result[0][2]);
        assertEquals(0, result[1][0]);
        assertEquals(0, result[1][1]);
        assertEquals(1, result[1][2]);
    }

    @Test
    public void toBinaryArrayDistanceEqualToThresholdIsBlackTest() {
        // distance of 1000 is not LESS than a threshold of 1000, so it should be black
        DistanceImageBinarizer binarizer = new DistanceImageBinarizer(new ExactMatchDistanceFinder(), 0xFF0000, 1000);
        BufferedImage img = new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB);
        img.setRGB(0, 0, 0x0000FF);

        int[][] result = binarizer.toBinaryArray(img);

        assertEquals(0, result[0][0]);
    }

    @Test
    public void toBinaryArrayPassesColorsWithoutAlphaTest() {
        RecordingDistanceFinder recorder = new RecordingDistanceFinder();
        DistanceImageBinarizer binarizer = new DistanceImageBinarizer(recorder, 0x123456, 10);
        BufferedImage img = new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB);
        img.setRGB(0, 0, 0xABCDEF);

        binarizer.toBinaryArray(img);

        // the pixel color and target should both arrive as 0xRRGGBB (no alpha), in either order
        boolean pixelThenTarget = recorder.lastColorA == 0xABCDEF && recorder.lastColorB == 0x123456;
        boolean targetThenPixel = recorder.lastColorA == 0x123456 && recorder.lastColorB == 0xABCDEF;
        assertEquals(true, pixelThenTarget || targetThenPixel);
    }
}

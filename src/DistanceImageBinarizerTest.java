import static org.junit.jupiter.api.Assertions.assertEquals;

import java.awt.image.BufferedImage;

import org.junit.jupiter.api.Test;

public class DistanceImageBinarizerTest {

    // A fake ColorDistanceFinder: toBufferedImage never needs distances,
    // so this just returns 0 and keeps the test independent of EuclideanColorDistance.
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
        }; // 2 rows (height), 3 columns (width)

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

        // getRGB takes (x, y), the array is [y][x]
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
}

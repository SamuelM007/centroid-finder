import static org.junit.jupiter.api.Assertions.*;

import java.awt.image.BufferedImage;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

public class BinarizingImageGroupFinderTest {
    private static final int WHITE = 0xffffff;
    private static final int BLACK = 0x000000;

    private ImageGroupFinder groupFinder;

    @BeforeEach
    void setUp() {
        groupFinder = new BinarizingImageGroupFinder(
            new DistanceImageBinarizer(new EuclideanColorDistance(), WHITE, 0),
            new DfsBinaryGroupFinder());
    }

    private BufferedImage blackImage(int w, int h) {
        BufferedImage img = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        for (int y = 0; y < h; y++)
            for (int x = 0; x < w; x++)
                img.setRGB(x, y, BLACK);
        return img;
    }

    @Test
    void allBlackImageHasNoGroups() {
        assertTrue(groupFinder.findConnectedGroups(blackImage(3, 3)).isEmpty());
    }

    @Test
    void singleWhitePixelIsOneGroup() {
        BufferedImage img = blackImage(3, 3);
        img.setRGB(1, 1, WHITE);

        assertEquals(1, groupFinder.findConnectedGroups(img).size());
    }

    @Test
    void diagonalWhitePixelsAreSeparateGroups() {
        BufferedImage img = blackImage(3, 3);
        img.setRGB(0, 0, WHITE);
        img.setRGB(1, 1, WHITE);

        // Connectivity is vertical/horizontal only, per your Javadoc
        assertEquals(2, groupFinder.findConnectedGroups(img).size());
    }

    @Test
    void largerGroupComesFirst() {
        BufferedImage img = blackImage(4, 4);
        img.setRGB(0, 0, WHITE);          // lone pixel
        img.setRGB(3, 3, WHITE);          // 3-pixel cluster
        img.setRGB(3, 2, WHITE);
        img.setRGB(2, 3, WHITE);

        List<Group> groups = groupFinder.findConnectedGroups(img);

        assertEquals(2, groups.size());
        // Then assert groups.get(0) is the size-3 group using your Group's accessors
    }
}
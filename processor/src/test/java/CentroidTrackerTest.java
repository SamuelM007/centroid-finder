import static org.junit.jupiter.api.Assertions.assertEquals;

import java.awt.image.BufferedImage;
import java.util.List;

import org.junit.jupiter.api.Test;

public class CentroidTrackerTest {

    private final BufferedImage blankImage = new BufferedImage(10, 10, BufferedImage.TYPE_INT_RGB);

    @Test
    public void returnsLargestGroupCentroidTest() {
        // Fake group finder that returns groups already sorted largest first
        ImageGroupFinder fakeFinder = image -> List.of(
                new Group(50, new Coordinate(3, 4)),
                new Group(10, new Coordinate(7, 8)));
        CentroidTracker tracker = new CentroidTracker(fakeFinder);

        assertEquals(new Coordinate(3, 4), tracker.findLargestCentroid(blankImage));
    }

    @Test
    public void noGroupsReturnsNegativeOneTest() {
        ImageGroupFinder fakeFinder = image -> List.of();
        CentroidTracker tracker = new CentroidTracker(fakeFinder);

        assertEquals(new Coordinate(-1, -1), tracker.findLargestCentroid(blankImage));
    }

    @Test
    public void worksWithOldGroupFinderTest() {
        // Black image with a 2x2 white square at (4,6)-(5,7) and a single white pixel at (0,0).
        // The square is the largest group -> centroid (4, 6) with integer division.
        BufferedImage image = new BufferedImage(10, 10, BufferedImage.TYPE_INT_RGB);
        image.setRGB(4, 6, 0xFFFFFF);
        image.setRGB(5, 6, 0xFFFFFF);
        image.setRGB(4, 7, 0xFFFFFF);
        image.setRGB(5, 7, 0xFFFFFF);
        image.setRGB(0, 0, 0xFFFFFF);

        ImageBinarizer binarizer = new DistanceImageBinarizer(new EuclideanColorDistance(), 0xFFFFFF, 10);
        ImageGroupFinder groupFinder = new BinarizingImageGroupFinder(binarizer, new DfsBinaryGroupFinder());
        CentroidTracker tracker = new CentroidTracker(groupFinder);

        assertEquals(new Coordinate(4, 6), tracker.findLargestCentroid(image));
    }

    @Test
    public void oldGroupFinderNoMatchReturnsNegativeOneTest() {
        // All black image, looking for white -> no groups
        ImageBinarizer binarizer = new DistanceImageBinarizer(new EuclideanColorDistance(), 0xFFFFFF, 10);
        ImageGroupFinder groupFinder = new BinarizingImageGroupFinder(binarizer, new DfsBinaryGroupFinder());
        CentroidTracker tracker = new CentroidTracker(groupFinder);

        assertEquals(new Coordinate(-1, -1), tracker.findLargestCentroid(blankImage));
    }
}

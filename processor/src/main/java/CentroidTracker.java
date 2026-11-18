import java.awt.image.BufferedImage;
import java.util.List;

/**
 * Finds the centroid of the largest group in an image.
 *
 * The group finding is done by an existing ImageGroupFinder
 * (for example, BinarizingImageGroupFinder). This class only picks the largest group.
 */
public class CentroidTracker {
    private final ImageGroupFinder groupFinder;
    private List<Group> groups;

    /**
     * @param groupFinder the ImageGroupFinder used to find groups in each image
     */
    public CentroidTracker(ImageGroupFinder groupFinder) {
        this.groupFinder = groupFinder;
    }

    /**
     * Returns the centroid of the largest group in the image.
     *
     * @param image the image to search
     * @return the largest group's centroid, or (-1, -1) if there are no groups
     */
    public Coordinate findLargestCentroid(BufferedImage image) {
        // Groups are sorted descending, so the first one is the largest
        groups = groupFinder.findConnectedGroups(image);
        if (groups.isEmpty()) {
            return new Coordinate(-1, -1);
        }
        return groups.get(0).centroid();
    }
}

/**
 * Checks whether a tracked centroid is an anomaly (a sudden jump that is
 * too far to be real movement, for example the tracker switching to a
 * different dark object).
 *
 * Each centroid is compared to the last GOOD centroid, not just the previous one,
 * so a long run of wrong frames stays flagged until the tracker comes back
 * near the real object.
 */
public class AnomalyDetector {
    private final double maxJump;
    private Coordinate lastGood = null;

    /**
     * @param maxJump the largest distance in pixels a centroid can move from the
     *                last good centroid before it is considered an anomaly
     */
    public AnomalyDetector(double maxJump) {
        this.maxJump = maxJump;
    }

    /**
     * Checks if the centroid is an anomaly.
     *
     * The first real centroid is always accepted. A centroid of (-1, -1)
     * (nothing found) is never an anomaly and does not change the last good centroid.
     *
     * @param centroid the centroid found in the current frame
     * @return true if the centroid jumped more than maxJump from the last good centroid
     */
    public boolean isAnomaly(Coordinate centroid) {
        if (centroid.x() == -1 && centroid.y() == -1) {
            return false;
        }

        if (lastGood == null) {
            lastGood = centroid;
            return false;
        }

        double distance = Math.hypot(centroid.x() - lastGood.x(), centroid.y() - lastGood.y());
        if (distance > maxJump) {
            return true;
        }

        lastGood = centroid;
        return false;
    }
}

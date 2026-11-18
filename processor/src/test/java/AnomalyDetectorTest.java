import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

public class AnomalyDetectorTest {

    @Test
    public void firstCentroidIsNeverAnomalyTest() {
        AnomalyDetector detector = new AnomalyDetector(50);

        assertFalse(detector.isAnomaly(new Coordinate(300, 300)));
    }

    @Test
    public void smallMovesAreNotAnomaliesTest() {
        AnomalyDetector detector = new AnomalyDetector(50);

        assertFalse(detector.isAnomaly(new Coordinate(100, 100)));
        assertFalse(detector.isAnomaly(new Coordinate(102, 101)));
        assertFalse(detector.isAnomaly(new Coordinate(105, 103)));
    }

    @Test
    public void bigJumpIsAnomalyTest() {
        AnomalyDetector detector = new AnomalyDetector(50);

        detector.isAnomaly(new Coordinate(40, 598));
        assertTrue(detector.isAnomaly(new Coordinate(269, 8)));
    }

    @Test
    public void jumpExactlyAtMaxIsNotAnomalyTest() {
        AnomalyDetector detector = new AnomalyDetector(50);

        detector.isAnomaly(new Coordinate(0, 0));
        assertFalse(detector.isAnomaly(new Coordinate(30, 40))); // distance is exactly 50
    }

    @Test
    public void longWrongRunStaysAnomalyTest() {
        // Once the tracker jumps away, every frame near the wrong spot stays an anomaly
        // because it is compared to the last GOOD centroid, not the previous frame
        AnomalyDetector detector = new AnomalyDetector(50);

        detector.isAnomaly(new Coordinate(40, 598));
        assertTrue(detector.isAnomaly(new Coordinate(305, 7)));
        assertTrue(detector.isAnomaly(new Coordinate(306, 7)));
        assertTrue(detector.isAnomaly(new Coordinate(306, 7)));
    }

    @Test
    public void comingBackNearLastGoodIsNotAnomalyTest() {
        AnomalyDetector detector = new AnomalyDetector(50);

        detector.isAnomaly(new Coordinate(40, 598));
        detector.isAnomaly(new Coordinate(269, 8));
        assertFalse(detector.isAnomaly(new Coordinate(40, 597)));
    }

    @Test
    public void notFoundIsNotAnomalyTest() {
        AnomalyDetector detector = new AnomalyDetector(50);

        detector.isAnomaly(new Coordinate(100, 100));
        assertFalse(detector.isAnomaly(new Coordinate(-1, -1)));
        // (-1, -1) does not replace the last good centroid
        assertFalse(detector.isAnomaly(new Coordinate(101, 100)));
        assertTrue(detector.isAnomaly(new Coordinate(400, 400)));
    }
}

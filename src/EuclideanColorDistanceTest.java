
import static org.junit.Assert.assertEquals;

import org.junit.jupiter.api.Test;

public class EuclideanColorDistanceTest {

    @Test
    public void simpleTwoColorTest() {
        EuclideanColorDistance colorDistance = new EuclideanColorDistance();
        int colorA = 0xffffff;
        int colorB = 0x000000;
        double expected = 441.672955;
        double actual = colorDistance.distance(colorA, colorB);
        assertEquals(expected, actual, 0.001);

    }

    @Test
    public void sameColorIsZeroTest() {
        EuclideanColorDistance colorDistance = new EuclideanColorDistance();
        double actual = colorDistance.distance(0x123456, 0x123456);
        assertEquals(0.0, actual, 0.001);
    }

    @Test
    public void redOnlyTest() {
        EuclideanColorDistance colorDistance = new EuclideanColorDistance();
        double actual = colorDistance.distance(0xff0000, 0x000000);
        assertEquals(255.0, actual, 0.001);
    }

    @Test
    public void greenOnlyTest() {
        EuclideanColorDistance colorDistance = new EuclideanColorDistance();
        double actual = colorDistance.distance(0x00ff00, 0x000000);
        assertEquals(255.0, actual, 0.001);
    }

    @Test
    public void blueOnlyTest() {
        EuclideanColorDistance colorDistance = new EuclideanColorDistance();
        double actual = colorDistance.distance(0x0000ff, 0x000000);
        assertEquals(255.0, actual, 0.001);
    }

    @Test
    public void redVsGreenTest() {
        EuclideanColorDistance colorDistance = new EuclideanColorDistance();
        double expected = 360.624458; // sqrt(255^2 + 255^2)
        double actual = colorDistance.distance(0xff0000, 0x00ff00);
        assertEquals(expected, actual, 0.001);
    }

    @Test
    public void mixedChannelsTest() {
        EuclideanColorDistance colorDistance = new EuclideanColorDistance();
        double expected = 83.138439; // each channel differs by 0x30 = 48
        double actual = colorDistance.distance(0x102030, 0x405060);
        assertEquals(expected, actual, 0.001);
    }

    @Test
    public void symmetricTest() {
        EuclideanColorDistance colorDistance = new EuclideanColorDistance();
        int colorA = 0xabcdef;
        int colorB = 0x123456;
        assertEquals(colorDistance.distance(colorA, colorB),
                colorDistance.distance(colorB, colorA), 0.001);
    }

}

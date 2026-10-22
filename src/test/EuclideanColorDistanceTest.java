
import static org.junit.Assert.assertEquals;

import org.junit.jupiter.api.Test;

public class EuclideanColorDistanceTest {

    @Test
    public void simpleTwoColorTest(){
        EuclideanColorDistance colorDistance = new EuclideanColorDistance();
        int colorA= 0xffffff;
        int colorB= 0x000000;
        double expected= 441.672955;
        double actual = colorDistance.distance(colorA,colorB);
        assertEquals(expected,actual,0.001);

    }
    
}

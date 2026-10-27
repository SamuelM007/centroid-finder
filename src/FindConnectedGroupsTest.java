import static org.junit.jupiter.api.Assertions.*;

import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

public class FindConnectedGroupsTest {
    private DfsBinaryGroupFinder finder; // TODO: replace with your implementing class

    @BeforeEach
    public void setUp() {
        finder = new DfsBinaryGroupFinder();
    }

    private static Group g(int size, int x, int y) {
        return new Group(size, new Coordinate(x, y));
    }

    // ---------- Exceptions ----------

    @Test
    public void nullImageThrowsNPE() {
        assertThrows(NullPointerException.class, () -> finder.findConnectedGroups(null));
    }

    @Test
    public void nullRowThrowsNPE() {
        int[][] image = { {1, 0}, null };
        assertThrows(NullPointerException.class, () -> finder.findConnectedGroups(image));
    }

    @Test
    public void emptyImageThrowsIAE() {
        assertThrows(IllegalArgumentException.class,
                () -> finder.findConnectedGroups(new int[0][0]));
    }

    @Test
    public void emptyRowsThrowIAE() {
        assertThrows(IllegalArgumentException.class,
                () -> finder.findConnectedGroups(new int[][] { {} }));
    }

    @Test
    public void jaggedImageThrowsIAE() {
        int[][] image = { {1, 0, 1}, {1, 0} };
        assertThrows(IllegalArgumentException.class, () -> finder.findConnectedGroups(image));
    }

    @Test
    public void invalidValueThrowsIAE() {
        int[][] image = { {1, 0}, {2, 1} };
        assertThrows(IllegalArgumentException.class, () -> finder.findConnectedGroups(image));
    }

    @Test
    public void negativeValueThrowsIAE() {
        int[][] image = { {1, -1} };
        assertThrows(IllegalArgumentException.class, () -> finder.findConnectedGroups(image));
    }

    // ---------- Basic behavior ----------

    @Test
    public void allZerosReturnsEmptyList() {
        int[][] image = { {0, 0}, {0, 0} };
        assertTrue(finder.findConnectedGroups(image).isEmpty());
    }

    @Test
    public void singlePixel() {
        assertEquals(List.of(g(1, 0, 0)),
                finder.findConnectedGroups(new int[][] { {1} }));
    }

    @Test
    public void fullImageIsOneGroup() {
        int[][] image = { {1, 1}, {1, 1} };
        // x sum = 2, 2/4 = 0 ; y sum = 2, 2/4 = 0 (integer division)
        assertEquals(List.of(g(4, 0, 0)), finder.findConnectedGroups(image));
    }

    // ---------- Connectivity ----------

    @Test
    public void diagonalPixelsAreNotConnected() {
        int[][] image = { {1, 0}, {0, 1} };
        // equal size, so larger x comes first
        assertEquals(List.of(g(1, 1, 1), g(1, 0, 0)), finder.findConnectedGroups(image));
    }

    @Test
    public void connectsAroundTurns() {
        int[][] image = {
            {1, 1, 0},
            {0, 1, 0},
            {0, 1, 1}
        };
        // pixels (x,y): (0,0) (1,0) (1,1) (1,2) (2,2) -> x sum 5, y sum 5 -> 5/5 = 1
        assertEquals(List.of(g(5, 1, 1)), finder.findConnectedGroups(image));
    }

    @Test
    public void snakeShapeIsOneGroup() {
        int[][] image = {
            {1, 1, 1},
            {0, 0, 1},
            {1, 1, 1}
        };
        // x sum = 8, y sum = 7, 7 pixels -> (1, 1)
        assertEquals(List.of(g(7, 1, 1)), finder.findConnectedGroups(image));
    }

    // ---------- Centroid / coordinates ----------

    @Test
    public void integerDivisionTruncatesCentroid() {
        // x sum = 0 + 1 = 1, 1/2 = 0
        assertEquals(List.of(g(2, 0, 0)),
                finder.findConnectedGroups(new int[][] { {1, 1} }));
    }

    @Test
    public void horizontalLineCentroid() {
        assertEquals(List.of(g(3, 1, 0)),
                finder.findConnectedGroups(new int[][] { {1, 1, 1} }));
    }

    @Test
    public void verticalLineCentroid() {
        assertEquals(List.of(g(3, 0, 1)),
                finder.findConnectedGroups(new int[][] { {1}, {1}, {1} }));
    }

    @Test
    public void rowAndColumnMapToYAndX() {
        // non-square: pixel at row 1, column 3 -> (x:3, y:1)
        int[][] image = {
            {0, 0, 0, 0},
            {0, 0, 0, 1}
        };
        assertEquals(List.of(g(1, 3, 1)), finder.findConnectedGroups(image));
    }

    // ---------- Sorting (descending by size, then x, then y) ----------

    @Test
    public void sortedBySizeDescending() {
        int[][] image = {
            {1, 1, 0, 1},
            {0, 0, 0, 1},
            {0, 0, 0, 1}
        };
        assertEquals(List.of(g(3, 3, 1), g(2, 0, 0)), finder.findConnectedGroups(image));
    }

    @Test
    public void equalSizeTieBrokenByXDescending() {
        int[][] image = {
            {1, 0, 1},
            {0, 0, 0},
            {1, 0, 0}
        };
        // size 1 each: (x:2,y:0), (x:0,y:2), (x:0,y:0)
        // x dominates y, so (2,0) comes before (0,2)
        assertEquals(List.of(g(1, 2, 0), g(1, 0, 2), g(1, 0, 0)),
                finder.findConnectedGroups(image));
    }

    @Test
    public void equalSizeAndXTieBrokenByYDescending() {
        int[][] image = {
            {1},
            {0},
            {1}
        };
        assertEquals(List.of(g(1, 0, 2), g(1, 0, 0)), finder.findConnectedGroups(image));
    }

    @Test
    public void mixedGroupsExactOrder() {
        int[][] image = {
            {1, 0, 1, 0, 1, 1},
            {0, 0, 0, 0, 0, 0},
            {1, 1, 0, 1, 0, 0},
            {0, 0, 0, 1, 0, 1}
        };
        // size 2: {(4,0),(5,0)} -> (4,0); {(3,2),(3,3)} -> (3,2); {(0,2),(1,2)} -> (0,2)
        // size 1: (5,3), (2,0), (0,0)
        assertEquals(List.of(
                g(2, 4, 0), g(2, 3, 2), g(2, 0, 2),
                g(1, 5, 3), g(1, 2, 0), g(1, 0, 0)),
                finder.findConnectedGroups(image));
    }

    // ---------- Input is not modified ----------

    @Test
    public void doesNotModifyInput() {
        int[][] image = { {1, 1, 0}, {0, 1, 0}, {1, 0, 1} };
        int[][] copy = { {1, 1, 0}, {0, 1, 0}, {1, 0, 1} };
        finder.findConnectedGroups(image);
        assertArrayEquals(copy, image);
    }
}
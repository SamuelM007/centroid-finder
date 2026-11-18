import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.Stack;

public class DfsBinaryGroupFinder implements BinaryGroupFinder {
   /**
    * Finds connected pixel groups of 1s in an integer array representing a binary image.
    * 
    * The input is a non-empty rectangular 2D array containing only 1s and 0s.
    * If the array or any of its subarrays are null, a NullPointerException
    * is thrown. If the array is otherwise invalid, an IllegalArgumentException
    * is thrown.
    *
    * Pixels are considered connected vertically and horizontally, NOT diagonally.
    * The top-left cell of the array (row:0, column:0) is considered to be coordinate
    * (x:0, y:0). Y increases downward and X increases to the right. For example,
    * (row:4, column:7) corresponds to (x:7, y:4).
    *
    * The method returns a list of sorted groups. The group's size is the number 
    * of pixels in the group. The centroid of the group
    * is computed as the average of each of the pixel locations across each dimension.
    * For example, the x coordinate of the centroid is the sum of all the x
    * coordinates of the pixels in the group divided by the number of pixels in that group.
    * Similarly, the y coordinate of the centroid is the sum of all the y
    * coordinates of the pixels in the group divided by the number of pixels in that group.
    * The division should be done as INTEGER DIVISION.
    *
    * The groups are sorted in DESCENDING order according to Group's compareTo method.
    * 
    * @param image a rectangular 2D array containing only 1s and 0s
    * @return the found groups of connected pixels in descending order
    */
    @Override
    public List<Group> findConnectedGroups(int[][] image) {
        imageChecker(image);

        Set<Coordinate> visited = new HashSet<>();
        List<Group> list = new ArrayList<>();
        
        for(int y = 0; y < image.length; y++){
            for(int x = 0; x < image[y].length; x++){
                if( image[y][x] == 1 && 
                    !visited.contains(new Coordinate(x, y))
                ){
                    list.add(groupBuilder(new Coordinate(x, y),image,visited));
                }
            }
        }

        list.sort(Comparator.reverseOrder());
        return list;
    }
        
    private Group groupBuilder(Coordinate start,int[][] image, Set<Coordinate> visited){
        
        Stack<Coordinate> stack = new Stack<>();
        stack.push(start);

        int groupSize = 0;
        int groupAverageX = 0;
        int groupAverageY = 0;

        int[][] directions = {{0,1},{0,-1},{1,0},{-1,0}};
        
        while(!stack.isEmpty()){
            Coordinate current = stack.pop();
            if(visited.contains(current))continue;
            visited.add(current);

            groupSize++;
            groupAverageX += current.x();
            groupAverageY += current.y();

            for(int[] direction : directions){
                Coordinate neighbor = new Coordinate(current.x()+direction[1],current.y()+direction[0]);
                if( neighbor.x() >= 0 && 
                    neighbor.x() < image[0].length &&
                    neighbor.y() >= 0 &&
                    neighbor.y() < image.length &&
                    image[neighbor.y()][neighbor.x()] != 0
                ){
                    stack.push(neighbor);
                }
            }
        }

        groupAverageX /= groupSize;
        groupAverageY /= groupSize;

        return new Group(groupSize,new Coordinate(groupAverageX,groupAverageY));

            
    }
    
    private void imageChecker(int[][] image){
        if(image == null) throw new NullPointerException();
        if(image.length == 0) throw new IllegalArgumentException();

        int width = image[0].length;
        if(width == 0) throw new IllegalArgumentException();

        for(int y = 0; y < image.length; y++){
            if(image[y] == null) throw new NullPointerException();
            if(image[y].length != width) throw new IllegalArgumentException();
            
            for(int x = 0; x < image[y].length; x++){
                if(image[y][x] != 0 && image[y][x] != 1) throw new IllegalArgumentException();
            }
        }
    }
}

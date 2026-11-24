package api;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import javax.imageio.ImageIO;

import org.bytedeco.javacv.FFmpegFrameGrabber;
import org.bytedeco.javacv.Java2DFrameConverter;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST routes for the videos stored in the server's {@code videos/} folder:
 * listing them, streaming a video, and getting its first frame as a thumbnail.
 */
@RestController
public class VideoController {

/**
 * Streams a video file. Handles {@code GET /api/video/{fileName}}.
 *
 * @param fileName the name of a file in the {@code videos/} folder
 * @return 200 with the video as {@code video/mp4}, or 404 if the file doesn't exist
 */
@GetMapping("/api/video/{fileName}")
 public ResponseEntity<Resource> getVideo(@PathVariable String fileName){
    File file = new File("videos/"+fileName);
    if(!file.exists()){
        return ResponseEntity.notFound().build();
    }
    Resource video = new FileSystemResource(file);
    return ResponseEntity.ok()
    .contentType(MediaType.parseMediaType("video/mp4"))
    .body(video);
 }

/**
 * Lists the names of every file in the {@code videos/} folder. Handles {@code GET /api/videos}.
 *
 * @return 200 with a JSON array of file names, or 500 with an error message if the folder can't be read
 */
  @GetMapping("/api/videos")
public ResponseEntity<?> getAllVideos(){
    File[] files = new File("videos").listFiles();
    if (files == null) {
        return ResponseEntity.internalServerError()
            .body(Map.of("error", "Error reading video directory"));
    }
    List<String> names = new ArrayList<>();
    for (File file : files) {
        names.add(file.getName());
    }
    return ResponseEntity.ok(names);
}

/**
 * Returns the first frame of a video as a JPEG. Handles {@code GET /api/thumbnail/{fileName}}.
 *
 * @param fileName the name of a file in the {@code videos/} folder
 * @return 200 with the frame as {@code image/jpeg}, 404 if the file doesn't exist,
 *         or 500 with an error message if the file can't be read as a video
 */
@GetMapping("/api/thumbnail/{fileName}")
public ResponseEntity<?> getThumbnail(@PathVariable String fileName){
    File file = new File("videos/" + fileName);
    if (!file.exists()) {
        return ResponseEntity.notFound().build();
    }
    try (FFmpegFrameGrabber grabber = new FFmpegFrameGrabber(file)) {
        grabber.start();
        BufferedImage image = new Java2DFrameConverter().convert(grabber.grabImage());
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "jpg", out);
        return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG).body(out.toByteArray());
    } catch (IOException e) {
        return ResponseEntity.internalServerError()
                .body(Map.of("error", "Error generating thumbnail"));
    }
}
}
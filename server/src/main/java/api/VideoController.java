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

@RestController
public class VideoController {

/**
 * Streams a video file (supports seeking). Sent with the content type for its extension.
 * 400 for an invalid file name, 404 if the video doesn't exist.
 */
@GetMapping("/api/video/{fileName}")
 public ResponseEntity<Resource> getVideo(@PathVariable String fileName){
    File file = InputValidator.requireVideoFile(fileName);
    if(!file.isFile()){
        return ResponseEntity.notFound().build();
    }
    Resource video = new FileSystemResource(file);
    return ResponseEntity.ok()
    .contentType(MediaType.parseMediaType(InputValidator.videoContentType(fileName)))
    .body(video);
 }

/** The names of the video files in the videos folder. Other files and folders are left out. */
  @GetMapping("/api/videos")
public ResponseEntity<?> getAllVideos(){
    File[] files = new File(InputValidator.VIDEO_DIR).listFiles();
    if (files == null) {
        return ResponseEntity.internalServerError()
            .body(Map.of("error", "Error reading video directory"));
    }
    List<String> names = new ArrayList<>();
    for (File file : files) {
        if (file.isFile() && InputValidator.isValidVideoName(file.getName())) {
            names.add(file.getName());
        }
    }
    return ResponseEntity.ok(names);
}

/**
 * The video's first frame as a JPEG.
 * 400 for an invalid file name, 404 if the video doesn't exist,
 * 422 if the file has no frames, 500 if it can't be read as a video.
 */
@GetMapping("/api/thumbnail/{fileName}")
public ResponseEntity<?> getThumbnail(@PathVariable String fileName){
    File file = InputValidator.requireVideoFile(fileName);
    if (!file.isFile()) {
        return ResponseEntity.notFound().build();
    }
    try (FFmpegFrameGrabber grabber = new FFmpegFrameGrabber(file);
         Java2DFrameConverter converter = new Java2DFrameConverter()) {
        grabber.start();
        BufferedImage image = converter.convert(grabber.grabImage());
        // grabImage() returns null when there's no frame to read
        if (image == null) {
            return ResponseEntity.unprocessableEntity()
                .body(Map.of("error", "Video has no frames to make a thumbnail from"));
        }
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "jpg", out);
        return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG).body(out.toByteArray());
    } catch (IOException e) {
        return ResponseEntity.internalServerError()
                .body(Map.of("error", "Error generating thumbnail"));
    }
}
}

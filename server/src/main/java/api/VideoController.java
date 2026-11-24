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
 * Streams a video file (supports seeking). Handles {@code GET /api/video/{fileName}}.
 *
 * @param fileName the name of a video file in the {@code videos/} folder
 * @return 200 with the video, sent with the content type for its extension
 *         (e.g. {@code video/mp4}, {@code video/quicktime}), 400 if the file name is invalid,
 *         or 404 if the file doesn't exist
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

/**
 * Lists the video files in the {@code videos/} folder. Handles {@code GET /api/videos}.
 * Folders and files without a video extension (like {@code .DS_Store}) are left out.
 *
 * @return 200 with a JSON array of file names, or 500 with an error message if the folder can't be read
 */
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
 * Returns the first frame of a video as a JPEG. Handles {@code GET /api/thumbnail/{fileName}}.
 *
 * @param fileName the name of a video file in the {@code videos/} folder
 * @return 200 with the frame as {@code image/jpeg}, 400 if the file name is invalid,
 *         404 if the file doesn't exist, 422 if the file has no video frames,
 *         or 500 with an error message if the file can't be read as a video
 */
@GetMapping("/api/thumbnail/{fileName}")
public ResponseEntity<?> getThumbnail(@PathVariable String fileName){
    // a bad file name throws InvalidInputException, which ApiExceptionHandler turns into a 400
    File file = InputValidator.requireVideoFile(fileName);
    if (!file.isFile()) {
        return ResponseEntity.notFound().build();
    }
    // try-with-resources closes the grabber and converter when we're done
    try (FFmpegFrameGrabber grabber = new FFmpegFrameGrabber(file);
         Java2DFrameConverter converter = new Java2DFrameConverter()) {
        grabber.start();
        BufferedImage image = converter.convert(grabber.grabImage());
        // grabImage() returns null when there's no frame to read (e.g. an audio-only file)
        if (image == null) {
            return ResponseEntity.unprocessableEntity()
                .body(Map.of("error", "Video has no frames to make a thumbnail from"));
        }
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "jpg", out);
        // send the jpg bytes back so the frontend can use the url as an <img> src
        return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG).body(out.toByteArray());
    } catch (IOException e) {
        // the file couldn't be opened or read as a video
        return ResponseEntity.internalServerError()
                .body(Map.of("error", "Error generating thumbnail"));
    }
}
}

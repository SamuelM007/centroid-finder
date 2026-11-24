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
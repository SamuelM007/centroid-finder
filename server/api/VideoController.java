package api;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class VideoController {

private final JobRepository jobs;

public VideoController(JobRepository jobs) {
    this.jobs = jobs;
}

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

 @PostMapping("/api/process/{fileName}")
public ResponseEntity<Map<String, String>> startProcess(@PathVariable String fileName,
                                           @RequestParam(required = false) String targetColor,
                                           @RequestParam(required = false) Integer threshold) {
    if (targetColor == null || threshold == null) {
        return ResponseEntity.badRequest()
            .body(Map.of("error", "Missing targetColor or threshold query parameter."));
    }
    File video = new File("videos/" + fileName);
    if (!video.isFile()) {
        return ResponseEntity.status(404).body(Map.of("error", "Video not found: " + fileName));
    }
   String jobId = UUID.randomUUID().toString();
    ProcessBuilder builder = new ProcessBuilder("java", "-jar", "../processor/target/videoprocessor.jar",
        "videos/" + fileName,
        "metadata/" + jobId + ".csv",
        targetColor,
        String.valueOf(threshold));
    builder.redirectOutput(ProcessBuilder.Redirect.DISCARD);
    builder.redirectError(ProcessBuilder.Redirect.DISCARD);
    try {
        Process process = builder.start();
        jobs.create(jobId, fileName, targetColor, threshold);
        process.onExit().thenAccept(p ->
            jobs.updateStatus(jobId, p.exitValue() == 0 ? "done" : "error"));
    } catch (IOException e) {
        return ResponseEntity.internalServerError().body(Map.of("error", "Error starting job"));
    }
    //Express version: res.status(202).send(jobId)
    return ResponseEntity.accepted().body(Map.of("jobId", jobId));

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

//checks if job is done. just return status for now
@GetMapping("/api/jobcheck/{jobId}")
public ResponseEntity<Map<String, String>> jobCheck(@PathVariable String jobId){
    String status = jobs.findStatus(jobId);
    if (status == null) {
        return ResponseEntity.status(404).body(Map.of("error", "Job ID not found"));
    }
    if (status.equals("done")) {
        return ResponseEntity.ok(Map.of("status", status, "result", "/metadata/" + jobId + ".csv"));
    }
    if (status.equals("error")) {
        return ResponseEntity.ok(Map.of("status", status, "error", "Error processing video"));
    }
    return ResponseEntity.ok(Map.of("status", status));
}
@GetMapping("/api/thumbnail/{fileName}")
public ResponseEntity<?> getThumbnail(@PathVariable String fileName){
    File file = new File("videos/" + fileName);
    if (!file.exists()) {
        return ResponseEntity.notFound().build();
    }
    try {
        Process ffmpeg = new ProcessBuilder("ffmpeg", "-i", file.getPath(),
                "-frames:v", "1", "-f", "image2pipe", "-vcodec", "mjpeg", "-")
                .redirectError(ProcessBuilder.Redirect.DISCARD)
                .start();
        byte[] jpeg = ffmpeg.getInputStream().readAllBytes();
        return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG).body(jpeg);
    } catch (IOException e) {
        return ResponseEntity.internalServerError()
                .body(Map.of("error", "Error generating thumbnail"));
    }
}
}

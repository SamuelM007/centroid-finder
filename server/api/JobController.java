package api;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.core.io.FileSystemResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class JobController {

private final JobRepository jobs;

public JobController(JobRepository jobs) {
    this.jobs = jobs;
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
    // create the job row before starting, so a fast exit can't update a row that doesn't exist yet
    jobs.create(jobId, fileName, targetColor, threshold);
    try {
        Process process = builder.start();
        process.onExit().thenAccept(p ->
            jobs.updateStatus(jobId, p.exitValue() == 0 ? JobStatus.DONE : JobStatus.ERROR));
    } catch (IOException e) {
        jobs.updateStatus(jobId, JobStatus.ERROR);
        return ResponseEntity.internalServerError().body(Map.of("error", "Error starting job"));
    }
    //Express version: res.status(202).send(jobId)
    return ResponseEntity.accepted().body(Map.of("jobId", jobId));

}

//checks if job is done
@GetMapping("/api/process/{jobId}/status")
public ResponseEntity<Map<String, String>> jobStatus(@PathVariable String jobId){
    JobStatus status = jobs.findStatus(jobId);
    if (status == null) {
        return ResponseEntity.status(404).body(Map.of("error", "Job ID not found"));
    }
    if (status == JobStatus.DONE) {
        return ResponseEntity.ok(Map.of("status", status.value(), "result", "/api/result/" + jobId));
    }
    if (status == JobStatus.ERROR) {
        return ResponseEntity.ok(Map.of("status", status.value(), "error", "Error processing video"));
    }
    return ResponseEntity.ok(Map.of("status", status.value()));
}

// all jobs, newest first (for the jobs history page)
@GetMapping("/api/jobs")
public ResponseEntity<List<Map<String, Object>>> getAllJobs() {
    return ResponseEntity.ok(jobs.findAll());
}

// one job with its settings and status
@GetMapping("/api/jobs/{jobId}")
public ResponseEntity<?> getJob(@PathVariable String jobId) {
    Map<String, Object> job = jobs.findById(jobId);
    if (job == null) {
        return ResponseEntity.status(404).body(Map.of("error", "Job ID not found"));
    }
    return ResponseEntity.ok(job);
}

// the CSV output of a finished job
@GetMapping("/api/result/{jobId}")
public ResponseEntity<?> getResult(@PathVariable String jobId) {
    // look the id up first so only real job ids are ever turned into a file path
    JobStatus status = jobs.findStatus(jobId);
    if (status == null) {
        return ResponseEntity.status(404).body(Map.of("error", "Job ID not found"));
    }
    File csv = new File("metadata/" + jobId + ".csv");
    if (status != JobStatus.DONE || !csv.isFile()) {
        return ResponseEntity.status(404).body(Map.of("error", "Result not available for this job"));
    }
    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType("text/csv"))
        .body(new FileSystemResource(csv));
}
}

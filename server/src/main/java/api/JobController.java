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

/**
 * Starts processing a video in the background.
 * 202 {"jobId"} when started, 400 for a missing or invalid targetColor, threshold or
 * file name, 404 if the video doesn't exist, 500 if the processor can't be started.
 */
 @PostMapping("/api/process/{fileName}")
public ResponseEntity<Map<String, String>> startProcess(@PathVariable String fileName,
                                           @RequestParam String targetColor,
                                           @RequestParam Integer threshold) {
    // validate everything before touching the file system or starting a process
    String color = InputValidator.requireHexColor(targetColor);
    int checkedThreshold = InputValidator.requireThreshold(threshold);
    File video = InputValidator.requireVideoFile(fileName);
    if (!video.isFile()) {
        return ResponseEntity.status(404).body(Map.of("error", "Video not found: " + fileName));
    }
   String jobId = UUID.randomUUID().toString();
    ProcessBuilder builder = new ProcessBuilder("java", "-jar", "../processor/target/videoprocessor.jar",
        video.getPath(),
        "metadata/" + jobId + ".csv",
        color,
        String.valueOf(checkedThreshold));
    builder.redirectOutput(ProcessBuilder.Redirect.DISCARD);
    builder.redirectError(ProcessBuilder.Redirect.DISCARD);
    // create the job row before starting, so a fast exit can't update a row that doesn't exist yet
    jobs.create(jobId, fileName, color, checkedThreshold);
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

/**
 * A job's status: {"status"}, plus "result" (the CSV URL) when done or "error" when it failed.
 * 400 for a malformed job ID, 404 for an unknown one.
 */
@GetMapping("/api/process/{jobId}/status")
public ResponseEntity<Map<String, String>> jobStatus(@PathVariable String jobId){
    InputValidator.requireJobId(jobId);
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

/** One job with its settings and status. 400 for a malformed job ID, 404 for an unknown one. */
@GetMapping("/api/jobs/{jobId}")
public ResponseEntity<?> getJob(@PathVariable String jobId) {
    InputValidator.requireJobId(jobId);
    Map<String, Object> job = jobs.findById(jobId);
    if (job == null) {
        return ResponseEntity.status(404).body(Map.of("error", "Job ID not found"));
    }
    return ResponseEntity.ok(job);
}

/**
 * The CSV output of a finished job.
 * 400 for a malformed job ID, 404 for an unknown job or a failed one,
 * 409 if the job is still processing.
 */
@GetMapping("/api/result/{jobId}")
public ResponseEntity<?> getResult(@PathVariable String jobId) {
    // only well-formed, real job ids are ever turned into a file path
    InputValidator.requireJobId(jobId);
    JobStatus status = jobs.findStatus(jobId);
    if (status == null) {
        return ResponseEntity.status(404).body(Map.of("error", "Job ID not found"));
    }
    if (status == JobStatus.PROCESSING) {
        return ResponseEntity.status(409).body(Map.of("error", "Result not ready yet; the job is still processing"));
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

# Video Processor Plan

## Goal
Take an mp4, run every frame through our existing centroid finder, and write a CSV
of `seconds,x,y` for the largest centroid in each frame (`-1,-1` if none found).

    java -jar videoprocessor.jar inputPath outputCsv targetColor threshold

## Library
- JavaCV (`FFmpegFrameGrabber` to read frames, `Java2DFrameConverter` to turn each
  frame into a `BufferedImage`)
- Chosen because it gives us `BufferedImage`s, which our existing classes already take

## Reused classes (unchanged)
- `EuclideanColorDistance` – color distance
- `DistanceImageBinarizer` – pixel → 0/1 using target color + threshold
- `DfsBinaryGroupFinder` – connected groups + centroids (already iterative DFS)
- `BinarizingImageGroupFinder` – binarize + find groups, sorted largest first
- `Group`, `Coordinate`

## New components
- VideoProcessorApp.java - Main component.
- VideoProcessorArguments.java - creates an object based on parameters passed to the App. Throws exceptions.
- CentroidTracker.java - Tracks Centroids in the frames and returns the largest one.

## Architecture


## Testing plan
- Arguments: valid input, wrong arg count, bad hex, non-integer threshold
- CentroidTracker: fake ImageGroupFinder (largest picked, empty → -1,-1)
- CSV writer: write to a StringWriter and check rows
- VideoProcessor: fake FrameSource + fake writer, no real video needed
- JavaCvFrameSource: generate a small mp4 in a temp folder with FFmpegFrameRecorder,
  check frame count, size, timestamps
- End-to-end: generated video with a black square on white → known centroid

## Packaging
- Maven Assembly Plugin, `jar-with-dependencies`, main class `VideoProcessorApp`,
  output `videoprocessor.jar`
- JAR and mp4 are in .gitignore

## Validation
- 
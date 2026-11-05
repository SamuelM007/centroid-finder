**1. JavaCV**
A Java library from the Bytedeco project that wraps native C/C++ libraries like FFmpeg and OpenCV, so you can call them from Java. Adding it in Maven downloads precompiled FFmpeg binaries for every OS, so nothing extra needs installing. You open a video with `FFmpegFrameGrabber`, call `grab()` to get each frame, and use `Java2DFrameConverter` to turn the frame into a `BufferedImage`. The grabber also gives you metadata like frame rate, length, width/height, and the current timestamp. Since FFmpeg does the decoding, it handles basically any video format and is fast.

--------------------
**2. JCodec**
A video codec library written entirely in Java, with no native code underneath. It decodes the video itself, so it works anywhere Java runs and the dependency is small. You use `FrameGrab` to open an MP4 and pull frames one at a time as `Picture` objects, then `AWTUtil.toBufferedImage()` converts them. The tradeoff is that pure-Java decoding is a lot slower than FFmpeg, and it only supports a few codecs (mainly H.264 in MP4). The docs are thin, so you end up reading source code or old Stack Overflow answers.

-------------------
**3. FFmpeg via ProcessBuilder**
Instead of a Java library, the program runs the `ffmpeg` command-line tool as a separate process with Java's `ProcessBuilder`. You'd have ffmpeg dump frames to image files (or pipe raw pixel data to stdout), then read them back into Java. Use `ffprobe` to get metadata like FPS and duration. It's powerful and adds no Maven dependency, but everyone running the project (your partner, the grader, CI) has to install ffmpeg separately. Managing temp files or parsing raw byte streams also makes the code messier.
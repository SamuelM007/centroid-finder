// What GET /api/videos returns: the file names in the backend's videos/ folder
export const mockVideoList = ['ensantina.mp4', 'salamander2.mov', 'forest_intro.mp4'];

// Every mock video uses the first frame of the sample salamander video as its thumbnail
export const MOCK_THUMBNAIL_URL = '/mock/thumbnail.png';

// The sample video isn't in git (it's 33 MB). Download it into public/mock/ to see it play.
export const MOCK_VIDEO_URL = '/mock/ensantina.mp4';

// A real CSV the backend produced for the sample video (target 660005, threshold 67)
export const MOCK_RESULT_URL = '/mock/salamander-track.csv';

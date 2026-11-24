import { useState } from 'react';
import { Link } from 'react-router-dom';
import StatusPill, { type PillKind } from './StatusPill';
import { api } from '../api';

/** Status text on the cards, worded for a video rather than a job. */
const CARD_LABELS: Record<PillKind, string> = {
  done: 'Tracked',
  processing: 'Processing',
  error: 'Last run failed',
  none: 'Not processed',
};

interface Props {
  /** The video's file name. */
  fileName: string;
  /** Status of the video's most recent job, or `'none'` if it has never been processed. */
  lastStatus: PillKind;
}

/**
 * One video in the Video Chooser grid: its first-frame thumbnail, name and last job
 * status. The whole card links to the video's preview page. If the thumbnail fails to
 * load, a plain dark box is shown instead.
 */
const VideoCard = ({ fileName, lastStatus }: Props) => {
  const [thumbFailed, setThumbFailed] = useState(false);
  return (
    <Link to={`/preview/${encodeURIComponent(fileName)}`} className="video-card">
      <div className="thumb">
        {!thumbFailed && <img src={api.thumbnailUrl(fileName)} alt="" loading="lazy" onError={() => setThumbFailed(true)} />}
        <svg className="thumb__play" width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
          <circle cx="22" cy="22" r="21" fill="#000" fillOpacity="0.35" />
          <path d="M18 14l12 8-12 8z" fill="#fff" />
        </svg>
      </div>
      <div className="video-card__body">
        <span className="video-card__title">{fileName}</span>
        <StatusPill status={lastStatus} label={CARD_LABELS[lastStatus]} />
      </div>
    </Link>
  );
};

export default VideoCard;

import { useState } from 'react';
import { Link } from 'react-router-dom';
import StatusPill, { type PillKind } from './StatusPill';
import { api } from '../api';

const CARD_LABELS: Record<PillKind, string> = {
  done: 'Tracked',
  processing: 'Processing',
  error: 'Last run failed',
  none: 'Not processed',
};

interface Props {
  fileName: string;
  lastStatus: PillKind;
}

// One clickable video in the Video Chooser grid
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

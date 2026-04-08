import './VideoPlayer.css';

interface Props {
  url: string;
  autoPlay?: boolean;
  controls?: boolean;
}

export default function VideoPlayer({ url, autoPlay = false, controls = true }: Props) {
  return (
    <div className="video-player">
      <video
        className="video-player__video"
        src={url}
        autoPlay={autoPlay}
        controls={controls}
        playsInline
        preload="metadata"
      />
    </div>
  );
}

import {Composition} from 'remotion';
import {HoneyFilm} from './HoneyFilm';

export const FPS = 30;
export const DURATION = 12 * FPS;

export const Root: React.FC = () => (
  <Composition
    id="HoneyFilm"
    component={HoneyFilm}
    durationInFrames={DURATION}
    fps={FPS}
    width={1920}
    height={1080}
  />
);

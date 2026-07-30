import React, { useMemo } from 'react';
import Svg, { Circle, Line as SvgLine } from 'react-native-svg';
import { buildSky } from '@/lib/constellation';

const STAR_COLOR = '#FBF4E9';
const LATENT_COLOR = '#9A93AD';
const LINE_COLOR = '#A489DE';

/**
 * A small, non-interactive preview of the recovery sky — the lit constellation
 * glowing out of a quiet full field. Used as the hero on the Me page so
 * progress is felt as light, not read as a number. Auto-fits via the SVG
 * viewBox, so it scales to whatever box it's dropped into.
 */
export function MiniSky({
  dates,
  userSeed,
  width,
  height,
}: {
  dates: string[];
  userSeed: string;
  width: number;
  height: number;
}) {
  const sky = useMemo(() => buildSky(dates, userSeed), [dates, userSeed]);
  const litStars = sky.stars.filter((s) => s.lit);
  const latentStars = sky.stars.filter((s) => !s.lit);
  const lastDate = litStars.length ? litStars[litStars.length - 1].date : null;

  const R = sky.radius + 18; // margin so edge stars aren't clipped
  const vb = `${-R} ${-R} ${R * 2} ${R * 2}`;

  return (
    <Svg width={width} height={height} viewBox={vb} preserveAspectRatio="xMidYMid slice">
      {latentStars.map((s, i) => (
        <Circle
          key={`u${i}`}
          cx={s.x}
          cy={s.y}
          r={s.r * (0.62 + s.twinkle * 0.4)}
          fill={LATENT_COLOR}
          fillOpacity={0.28 + s.twinkle * 0.34}
        />
      ))}
      {sky.lines.map((l, i) => (
        <SvgLine
          key={`l${i}`}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke={LINE_COLOR}
          strokeOpacity={l.opacity}
          strokeWidth={0.6}
        />
      ))}
      {litStars.map((s, i) => {
        const isLatest = s.date === lastDate;
        return (
          <React.Fragment key={`s${i}`}>
            {isLatest && <Circle cx={s.x} cy={s.y} r={s.r + 5} fill={LINE_COLOR} fillOpacity={0.16} />}
            <Circle cx={s.x} cy={s.y} r={s.r + 2.4} fill={STAR_COLOR} fillOpacity={0.14} />
            <Circle
              cx={s.x}
              cy={s.y}
              r={isLatest ? s.r + 0.8 : s.r}
              fill={STAR_COLOR}
              fillOpacity={isLatest ? 1 : 0.72 + s.twinkle * 0.28}
            />
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

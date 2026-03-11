import React, { useRef, useCallback } from 'react';
import './DialControl.css';

const DialControl = ({ label, value, onChange, min = 0, max = 100 }) => {
  const dialRef = useRef(null);
  const dragging = useRef(false);

  // Map value (0-100) to rotation angle (-135 to +135 degrees)
  const rotation = ((value - min) / (max - min)) * 270 - 135;

  const getValueFromAngle = useCallback((clientX, clientY) => {
    const rect = dialRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let angle = Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
    // Convert from atan2 coords to our dial coords (0 = top)
    angle = angle + 90;
    if (angle < -180) angle += 360;
    if (angle > 180) angle -= 360;
    // Clamp to -135..135 range
    angle = Math.max(-135, Math.min(135, angle));
    // Map angle to value
    const val = Math.round(((angle + 135) / 270) * (max - min) + min);
    return Math.max(min, Math.min(max, val));
  }, [min, max]);

  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    dialRef.current.setPointerCapture(e.pointerId);
    onChange(getValueFromAngle(e.clientX, e.clientY));
  }, [getValueFromAngle, onChange]);

  const handlePointerMove = useCallback((e) => {
    if (!dragging.current) return;
    onChange(getValueFromAngle(e.clientX, e.clientY));
  }, [getValueFromAngle, onChange]);

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const handleSliderChange = (e) => {
    onChange(parseInt(e.target.value));
  };

  // SVG tick marks for the dial
  const ticks = [];
  for (let i = 0; i <= 20; i++) {
    const tickAngle = -135 + (i / 20) * 270;
    const isMajor = i % 5 === 0;
    const r1 = isMajor ? 28 : 30;
    const r2 = 34;
    const rad = (tickAngle * Math.PI) / 180;
    ticks.push(
      <line
        key={i}
        x1={40 + r1 * Math.sin(rad)}
        y1={40 - r1 * Math.cos(rad)}
        x2={40 + r2 * Math.sin(rad)}
        y2={40 - r2 * Math.cos(rad)}
        stroke={isMajor ? '#888' : '#bbb'}
        strokeWidth={isMajor ? 1.5 : 0.8}
      />
    );
  }

  // Arc for the filled portion
  const arcRadius = 32;
  const startAngle = -135;
  const endAngle = rotation;
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const arcPath = endAngle > startAngle
    ? `M ${40 + arcRadius * Math.sin(startRad)} ${40 - arcRadius * Math.cos(startRad)} A ${arcRadius} ${arcRadius} 0 ${largeArc} 1 ${40 + arcRadius * Math.sin(endRad)} ${40 - arcRadius * Math.cos(endRad)}`
    : '';

  return (
    <div className="dial-control">
      <div className="dial-row">
        <svg
          ref={dialRef}
          className="dial-svg"
          viewBox="0 0 80 80"
          width="56"
          height="56"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          role="slider"
          aria-label={label}
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          tabIndex={0}
        >
          {/* Outer ring */}
          <circle cx="40" cy="40" r="36" fill="url(#dialOuter)" stroke="#c0c0c0" strokeWidth="1.5" />
          {/* Inner knob */}
          <circle cx="40" cy="40" r="24" fill="url(#dialKnob)" stroke="#b0b0b0" strokeWidth="1" />
          {/* Tick marks */}
          {ticks}
          {/* Filled arc */}
          {arcPath && (
            <path d={arcPath} fill="none" stroke="#FF8C42" strokeWidth="3" strokeLinecap="round" />
          )}
          {/* Pointer indicator */}
          <line
            x1="40"
            y1="40"
            x2={40 + 18 * Math.sin((rotation * Math.PI) / 180)}
            y2={40 - 18 * Math.cos((rotation * Math.PI) / 180)}
            stroke="#444"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Center dot */}
          <circle cx="40" cy="40" r="3" fill="#666" />
          {/* Gradient defs */}
          <defs>
            <radialGradient id="dialOuter" cx="40%" cy="35%">
              <stop offset="0%" stopColor="#f0f0f0" />
              <stop offset="100%" stopColor="#d0d0d0" />
            </radialGradient>
            <radialGradient id="dialKnob" cx="35%" cy="30%">
              <stop offset="0%" stopColor="#fafafa" />
              <stop offset="50%" stopColor="#e8e8e8" />
              <stop offset="100%" stopColor="#d4d4d4" />
            </radialGradient>
          </defs>
        </svg>
        <div className="dial-slider-col">
          <label className="dial-label">
            <span>{label}</span>
            <span className="dial-value">{value}%</span>
          </label>
          <input
            type="range"
            className="dial-slider"
            min={min}
            max={max}
            value={value}
            onChange={handleSliderChange}
          />
        </div>
      </div>
    </div>
  );
};

export default DialControl;

import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/Screensaver.css';

export interface ScreensaverProps {
  onDismiss: () => void;
  backgroundImage: string;
  logoSrc: string;
  logoAlt?: string;
  pillText?: string;
}

export default function Screensaver({
  onDismiss,
  backgroundImage,
  logoSrc,
  logoAlt = 'Logo',
  pillText,
}: ScreensaverProps) {
  const [dismissed, setDismissed] = useState(false);
  const [imageReady, setImageReady] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = backgroundImage;
    img.onload = () => setImageReady(true);
  }, [backgroundImage]);

  const handleClick = useCallback(() => {
    setDismissed(true);
  }, []);

  const overlay = (
    <AnimatePresence onExitComplete={onDismiss}>
      {!dismissed && imageReady && (
        <motion.div
          className="screensaver-overlay"
          onClick={handleClick}
          initial={{ y: 0 }}
          exit={{ y: '-100%' }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="screensaver-bg">
            <div
              className="screensaver-slide screensaver-ken-burns"
              style={{ backgroundImage: `url(${backgroundImage})` }}
            />
          </div>

          <div className="screensaver-center">
            <motion.div
              className="screensaver-logo"
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <img src={logoSrc} alt={logoAlt} className="screensaver-connect-logo" />
            </motion.div>
          </div>

          {pillText && (
            <div className="screensaver-bottom">
              <motion.div
                className="screensaver-pill"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="screensaver-pill-dot" />
                {pillText}
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(overlay, document.body);
}

export { Screensaver };

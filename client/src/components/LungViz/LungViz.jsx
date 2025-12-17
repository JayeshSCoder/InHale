import { motion } from 'framer-motion';

const lungPath =
  'M12 2C12 2 11 2.5 11 4C11 5.5 12 6 12 6C12 6 13 5.5 13 4C13 2.5 12 2 12 2ZM7.5 5C5.5 5 3.5 6 3.5 9C3.5 11 4.5 12 5.5 14C4.5 15 3.5 17 3.5 19C3.5 20.5 4.5 21.5 5.5 21.5C7 21.5 8.5 20 8.5 18C8.5 17 8 16 8 16C9 16 10 15 10 14V8C10 6 9 5 7.5 5ZM16.5 5C15 5 14 6 14 8V14C14 15 15 16 16 16C16 16 15.5 17 15.5 18C15.5 20 17 21.5 18.5 21.5C19.5 21.5 20.5 20.5 20.5 19C20.5 17 19.5 15 18.5 14C19.5 12 20.5 11 20.5 9C20.5 6 18.5 5 16.5 5Z';

const getBreathProfile = (aqiValue) => {
  if (aqiValue < 50) {
    return {
      color: '#22c55e',
      animate: { scale: [1, 1.05, 1] },
      transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
    };
  }

  if (aqiValue <= 100) {
    return {
      color: '#eab308',
      animate: { scale: [1, 1.05, 1] },
      transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
    };
  }

  if (aqiValue <= 150) {
    return {
      color: '#f97316',
      animate: { scale: [1, 1.03, 1] },
      transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
    };
  }

  return {
    color: '#ef4444',
    animate: { scale: [1, 1.02, 0.98, 1.02, 1] },
    transition: { duration: 0.8, repeat: Infinity, ease: 'linear' },
  };
};

const LungViz = ({ aqi = 0 }) => {
  const safeAQI = Number.isFinite(Number(aqi)) ? Number(aqi) : 0;
  const { color, animate, transition } = getBreathProfile(safeAQI);

  return (
    <motion.div
      animate={animate}
      transition={transition}
      style={{ width: 200, height: 200, margin: '0 auto' }}
    >
      <svg width="200" height="200" viewBox="0 0 24 24" role="img" aria-label="Lung health visualization">
        <path d={lungPath} fill={color} />
      </svg>
    </motion.div>
  );
};

export default LungViz;

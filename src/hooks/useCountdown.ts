import { useState, useEffect } from 'react';

/**
 * Target time in HH:mm format (e.g. "18:00")
 * Returns hours, minutes, seconds remaining and whether cutoff has passed.
 */
export function useCountdown(targetTimeStr: string) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isPassed: boolean;
    formatted: string;
  }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPassed: false,
    formatted: '00:00:00',
  });

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const [targetH, targetM] = targetTimeStr.split(':').map(Number);
      const target = new Date();
      target.setHours(targetH, targetM, 0, 0);

      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft({
          hours: 0,
          minutes: 0,
          seconds: 0,
          isPassed: true,
          formatted: 'Cutoff Passed',
        });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const pad = (n: number) => n.toString().padStart(2, '0');
      setTimeLeft({
        hours,
        minutes,
        seconds,
        isPassed: false,
        formatted: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetTimeStr]);

  return timeLeft;
}

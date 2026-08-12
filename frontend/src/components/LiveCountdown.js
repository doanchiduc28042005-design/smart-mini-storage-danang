import React, { useState, useEffect } from 'react';

const LiveCountdown = ({ startDateStr, durationDays }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [elapsedText, setElapsedText] = useState('');

  useEffect(() => {
    const calculateTime = () => {
      const start = new Date(startDateStr);
      const now = new Date();
      const elapsedMs = now.getTime() - start.getTime();
      const elapsedDays = Math.floor(elapsedMs / (1000 * 3600 * 24));
      setElapsedText(`Đã lưu kho: ${elapsedDays} ngày`);

      if (durationDays > 0) {
        const end = new Date(start.getTime() + durationDays * 24 * 3600 * 1000);
        const remainingMs = end.getTime() - now.getTime();
        
        if (remainingMs <= 0) {
          setIsExpired(true);
          setTimeLeft(formatTime(Math.abs(remainingMs)));
        } else {
          setIsExpired(false);
          setTimeLeft(formatTime(remainingMs));
        }
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [startDateStr, durationDays]);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const hours = Math.floor(totalSeconds / 3600) % 24;
    const days = Math.floor(totalSeconds / (3600 * 24));
    
    let result = '';
    if (days >= 30) {
      const months = Math.floor(days / 30);
      const remDays = days % 30;
      result += `${months} tháng `;
      if (remDays > 0) result += `${remDays} ngày `;
    } else if (days > 0) {
      result += `${days} ngày `;
    }
    
    result += `${hours.toString().padStart(2, '0')} giờ ${minutes.toString().padStart(2, '0')} phút ${seconds.toString().padStart(2, '0')} giây`;
    return result;
  };

  if (durationDays > 0) {
    if (isExpired) {
      return (
        <div className="flex flex-col border-t border-blue-200 border-dashed mt-1 pt-1">
          <span className="text-red-600 font-bold text-sm">⚠️ Quá hạn: {timeLeft}</span>
          <span className="text-gray-500 text-[10px]">(Từ: {new Date(startDateStr).toLocaleString('vi-VN')})</span>
        </div>
      );
    }
    return (
      <div className="flex flex-col border-t border-blue-200 border-dashed mt-1 pt-1">
        <span className="text-green-600 font-bold text-sm">⏱️ Còn lại: {timeLeft}</span>
        <span className="text-gray-500 text-[10px]">(Từ: {new Date(startDateStr).toLocaleString('vi-VN')})</span>
      </div>
    );
  }

  // If no specific duration, just show elapsed
  return (
    <div className="flex flex-col border-t border-blue-200 border-dashed mt-1 pt-1">
      <span className="text-blue-700 text-sm font-medium">{elapsedText}</span>
      <span className="text-gray-500 text-[10px]">(Từ: {new Date(startDateStr).toLocaleString('vi-VN')})</span>
    </div>
  );
};

export default LiveCountdown;

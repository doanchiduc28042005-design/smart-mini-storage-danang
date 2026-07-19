import React from 'react';

const PasswordStrength = ({ password }) => {
  const calculateStrength = (pass) => {
    let score = 0;
    if (!pass) return { score: 0, label: '', color: 'bg-gray-200', textColor: 'text-gray-500' };

    if (pass.length > 5) score += 1;
    if (pass.length > 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score, label: 'Yếu', color: 'bg-red-500', textColor: 'text-red-500' };
    if (score <= 4) return { score, label: 'Trung bình', color: 'bg-yellow-500', textColor: 'text-yellow-600' };
    return { score, label: 'Mạnh', color: 'bg-green-500', textColor: 'text-green-600' };
  };

  const strength = calculateStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full transition-all duration-300 ease-in-out ${strength.color}`}
          style={{ width: `${(strength.score / 5) * 100}%` }}
        ></div>
      </div>
      <p className={`text-xs font-medium text-right ${strength.textColor}`}>
        Độ mạnh: {strength.label}
      </p>
    </div>
  );
};

export default PasswordStrength;

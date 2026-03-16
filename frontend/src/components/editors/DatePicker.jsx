import React, { useState } from 'react';

/**
 * DatePicker component that formats dates as DD/MM/YY
 * Uses native HTML5 date input which provides calendar picker in modern browsers
 */
export function DatePicker({ value, onChange, onBlur, placeholder, disabled, className = '' }) {
  const [isFocused, setIsFocused] = useState(false);

  // Convert DD/MM/YY format to YYYY-MM-DD (ISO format for date input)
  const parseDateForInput = (dateStr) => {
    if (!dateStr || dateStr.trim() === '') return '';
    
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // Try to parse DD/MM/YY format
    const ddmmyyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (ddmmyyMatch) {
      const [, day, month, year] = ddmmyyMatch;
      const fullYear = year.length === 2 ? (parseInt(year) < 50 ? `20${year}` : `19${year}`) : year;
      return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Try to parse DD-MM-YY format
    const ddmmyyDashMatch = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
    if (ddmmyyDashMatch) {
      const [, day, month, year] = ddmmyyDashMatch;
      const fullYear = year.length === 2 ? (parseInt(year) < 50 ? `20${year}` : `19${year}`) : year;
      return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return '';
  };

  // Convert YYYY-MM-DD (ISO format) to DD/MM/YY
  const formatDateForDisplay = (isoDate) => {
    if (!isoDate || isoDate.trim() === '') return '';
    
    // If already in DD/MM/YY format, return as is
    if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(isoDate)) {
      return isoDate;
    }
    
    // Convert from YYYY-MM-DD to DD/MM/YY
    const isoMatch = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      const yy = year.slice(-2);
      return `${day}/${month}/${yy}`;
    }
    
    return isoDate; // Return as-is if can't parse
  };

  const inputValue = parseDateForInput(value);
  const displayValue = formatDateForDisplay(value);

  const handleChange = (e) => {
    const isoDate = e.target.value;
    if (isoDate) {
      // Convert ISO date to DD/MM/YY format
      const formatted = formatDateForDisplay(isoDate);
      onChange(formatted);
    } else {
      onChange('');
    }
  };

  return (
    <div className="relative">
      <input
        type="date"
        value={inputValue}
        onChange={handleChange}
        onBlur={(e) => {
          setIsFocused(false);
          if (onBlur) onBlur(e);
        }}
        onFocus={() => setIsFocused(true)}
        disabled={disabled}
        className={`w-full border rounded px-3 py-2 pr-10 ${isFocused ? 'ring-2 ring-blue-500 border-blue-500' : ''} ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
        style={{
          colorScheme: 'light',
        }}
      />
      <svg
        className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    </div>
  );
}

export default DatePicker;

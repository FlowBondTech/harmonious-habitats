import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
  label?: string;
  required?: boolean;
}

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  label?: string;
  required?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  minDate = new Date().toISOString().split('T')[0],
  label = "Date",
  required = false
}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [viewMonth, setViewMonth] = useState(new Date());
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0, width: 0 });
  const calendarRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Parse the value or use today
  const selectedDate = value ? new Date(value + 'T00:00:00') : null;

  const updateCalendarPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCalendarPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width
      });
    }
  }, []);

  // Update position when calendar becomes visible
  useLayoutEffect(() => {
    if (showCalendar) {
      updateCalendarPosition();
    }
  }, [showCalendar, updateCalendarPosition]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };

    const handleScrollOrResize = () => {
      if (showCalendar) {
        updateCalendarPosition();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [showCalendar, updateCalendarPosition]);

  const toggleCalendar = () => {
    if (!showCalendar) {
      updateCalendarPosition();
    }
    setShowCalendar(!showCalendar);
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const changeMonth = (increment: number) => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + increment));
  };

  const selectDate = (day: number) => {
    const newDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    const dateStr = newDate.toISOString().split('T')[0];
    onChange(dateStr);
    setShowCalendar(false);
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(viewMonth);
    const firstDay = getFirstDayOfMonth(viewMonth);
    const days = [];
    const today = new Date();
    const minDateObj = new Date(minDate + 'T00:00:00');

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
      const dateStr = currentDate.toISOString().split('T')[0];
      const isSelected = selectedDate && dateStr === value;
      const isToday = currentDate.toDateString() === today.toDateString();
      const isDisabled = currentDate < minDateObj;

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => !isDisabled && selectDate(day)}
          disabled={isDisabled}
          className={`
            h-10 rounded-lg transition-all font-medium
            ${isSelected
              ? 'bg-forest-600 text-white'
              : isToday
              ? 'bg-forest-100 text-forest-700 hover:bg-forest-200'
              : isDisabled
              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-forest-700 mb-2">
        {label} {required && '*'}
      </label>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleCalendar}
        className="w-full px-4 py-3 border border-forest-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent bg-white dark:bg-gray-800 text-left flex items-center justify-between hover:border-forest-300 dark:hover:border-gray-500 transition-colors"
      >
        <span className={value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}>
          {value ? formatDisplayDate(value) : 'Select date'}
        </span>
        <Calendar className="h-5 w-5 text-forest-400" />
      </button>

      {showCalendar && createPortal(
        <div
          ref={calendarRef}
          className="fixed z-[9999] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 animate-fade-in"
          style={{
            top: `${calendarPosition.top}px`,
            left: `${calendarPosition.left}px`,
            width: calendarPosition.width > 0 ? `${calendarPosition.width}px` : 'auto',
            minWidth: '300px'
          }}
        >
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {monthNames[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </h3>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 h-8 flex items-center justify-center">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
          </div>

          {/* Today Button */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                onChange(today);
                setShowCalendar(false);
              }}
              className="w-full py-2 text-sm font-medium text-forest-600 dark:text-forest-400 hover:bg-forest-50 dark:hover:bg-forest-900/20 rounded-lg transition-colors"
            >
              Today
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  label = "Time",
  required = false
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('00');
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const pickerRef = useRef<HTMLDivElement>(null);

  // Parse the value when it changes
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      const hourNum = parseInt(h);
      if (hourNum === 0) {
        setHour('12');
        setPeriod('AM');
      } else if (hourNum === 12) {
        setHour('12');
        setPeriod('PM');
      } else if (hourNum > 12) {
        setHour(String(hourNum - 12));
        setPeriod('PM');
      } else {
        setHour(String(hourNum));
        setPeriod('AM');
      }
      setMinute(m);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateTime = (newHour: string, newMinute: string, newPeriod: 'AM' | 'PM') => {
    let hour24 = parseInt(newHour);
    if (newPeriod === 'AM' && hour24 === 12) hour24 = 0;
    if (newPeriod === 'PM' && hour24 !== 12) hour24 += 12;

    const timeStr = `${hour24.toString().padStart(2, '0')}:${newMinute}`;
    onChange(timeStr);
  };

  const formatDisplayTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hourNum = parseInt(h);
    let displayHour = hourNum;
    let displayPeriod = 'AM';

    if (hourNum === 0) {
      displayHour = 12;
    } else if (hourNum === 12) {
      displayPeriod = 'PM';
    } else if (hourNum > 12) {
      displayHour = hourNum - 12;
      displayPeriod = 'PM';
    }

    return `${displayHour}:${m} ${displayPeriod}`;
  };

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

  return (
    <div className="relative" ref={pickerRef}>
      <label className="block text-sm font-medium text-forest-700 mb-2">
        {label} {required && '*'}
      </label>
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="w-full px-4 py-3 border border-forest-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent bg-white dark:bg-gray-800 text-left flex items-center justify-between hover:border-forest-300 dark:hover:border-gray-500 transition-colors"
      >
        <span className={value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}>
          {value ? formatDisplayTime(value) : 'Select time'}
        </span>
        <Clock className="h-5 w-5 text-forest-400" />
      </button>

      {showPicker && (
        <div className="absolute z-50 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 animate-fade-in right-0">
          <div className="flex gap-2">
            {/* Hour Selection */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Hour</label>
              <div className="grid grid-cols-3 gap-1 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {hours.map(h => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => {
                      setHour(h);
                      updateTime(h, minute, period);
                    }}
                    className={`py-2 px-1 text-sm rounded-lg transition-colors ${
                      hour === h
                        ? 'bg-forest-600 text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Minute Selection */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Minute</label>
              <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {minutes.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMinute(m);
                      updateTime(hour, m, period);
                    }}
                    className={`py-2 px-1 text-sm rounded-lg transition-colors ${
                      minute === m
                        ? 'bg-forest-600 text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* AM/PM Selection */}
            <div className="w-16">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Period</label>
              <div className="space-y-1">
                {(['AM', 'PM'] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setPeriod(p);
                      updateTime(hour, minute, p);
                    }}
                    className={`w-full py-2 px-2 text-sm rounded-lg transition-colors ${
                      period === p
                        ? 'bg-forest-600 text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Select Options */}
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={() => {
                setShowPicker(false);
              }}
              className="w-full py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
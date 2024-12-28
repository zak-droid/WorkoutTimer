import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type InitialState = {
  WORK_TIME: number;
  REST_TIME: number;
  TOTAL_DURATION: number;
  PREP_TIME: number;
  COLORS: {
    WORK: string;
    REST: string;
    BACKGROUND: string;
    TEXT: string;
  };
};

const INITIAL_STATES: InitialState = {
  WORK_TIME: 40,
  REST_TIME: 20,
  TOTAL_DURATION: 8,
  PREP_TIME: 3,
  COLORS: {
    WORK: '#00FF00',
    REST: '#FF0000',
    BACKGROUND: '#000000',
    TEXT: '#FFFFFF',
  },
};

type ColorPickerProps = {
  label: string;
  color: string;
  onChange: (color: string) => void;
};

const ColorPicker: React.FC<ColorPickerProps> = ({ label, color, onChange }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium mb-2">{label}</label>
    <div className="flex items-center space-x-2">
      <input
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="w-12 h-12 rounded cursor-pointer"
      />
      <input
        type="text"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 p-2 border rounded bg-white text-black"
      />
    </div>
  </div>
);

type TimerSettingProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

const TimerSetting: React.FC<TimerSettingProps> = ({ label, value, onChange, min = 1, max = 3600 }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium mb-2">{label}</label>
    <div className="flex items-center space-x-2">
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const newValue = Math.max(min, Math.min(max, parseInt(e.target.value) || min));
          onChange(newValue);
        }}
        min={min}
        max={max}
        className="w-24 p-2 border rounded bg-white text-black"
      />
      <span className="text-sm text-gray-600">seconds</span>
    </div>
  </div>
);

type UseTimerHook = (
  callback: () => void,
  delay: number | null,
  dependencies?: React.DependencyList
) => React.MutableRefObject<NodeJS.Timeout | null>;

const useTimer: UseTimerHook = (callback, delay, dependencies = []) => {
  const savedCallback = React.useRef(callback);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay !== null) {
      intervalRef.current = setInterval(() => savedCallback.current(), delay);
      return () => clearInterval(intervalRef.current!);
    }
  }, [delay, ...dependencies]);

  return intervalRef;
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const calculateProgress = (current: number, max: number): number => ((max - current) / max) * 100;

const WorkoutTimer: React.FC = () => {
  // Timer states with full customization
  const [workTime, setWorkTime] = useState<number>(INITIAL_STATES.WORK_TIME);
  const [restTime, setRestTime] = useState<number>(INITIAL_STATES.REST_TIME);
  const [totalDuration, setTotalDuration] = useState<number>(INITIAL_STATES.TOTAL_DURATION);
  const [prepareTime, setPrepareTime] = useState<number>(INITIAL_STATES.PREP_TIME);
  const [currentTime, setCurrentTime] = useState<number>(INITIAL_STATES.WORK_TIME);
  const [isWork, setIsWork] = useState<boolean>(true);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isPreparing, setIsPreparing] = useState<boolean>(false);
  const [prepTime, setPrepTime] = useState<number>(INITIAL_STATES.PREP_TIME);
  const [sessionTime, setSessionTime] = useState<number>(0);
  
  // Color states
  const [workColor, setWorkColor] = useState<string>(INITIAL_STATES.COLORS.WORK);
  const [restColor, setRestColor] = useState<string>(INITIAL_STATES.COLORS.REST);
  const [bgColor, setBgColor] = useState<string>(INITIAL_STATES.COLORS.BACKGROUND);
  const [textColor, setTextColor] = useState<string>(INITIAL_STATES.COLORS.TEXT);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Reset current time when work time changes
  useEffect(() => {
    if (!isActive && isWork) {
      setCurrentTime(workTime);
    }
  }, [workTime, isActive, isWork]);

  const startPrepTimer = useCallback(() => {
    setIsPreparing(true);
    setPrepTime(prepareTime);
  }, [prepareTime]);

  useTimer(
    () => {
      setPrepTime((prev) => {
        if (prev <= 1) {
          setIsPreparing(false);
          setIsActive(true);
          return prepareTime;
        }
        return prev - 1;
      });
    },
    isPreparing ? 1000 : null
  );

  const toggleTimer = useCallback(() => {
    if (!isActive && !isPreparing) {
      startPrepTimer();
    } else {
      setIsActive((prev) => !prev);
    }
  }, [isActive, isPreparing, startPrepTimer]);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    setIsPreparing(false);
    setPrepTime(prepareTime);
    setCurrentTime(workTime);
    setIsWork(true);
    setSessionTime(0);
  }, [workTime, prepareTime]);

  useTimer(
    () => {
      setCurrentTime((prev) => {
        if (prev <= 1) {
          setIsWork((prevIsWork) => !prevIsWork);
          return prev === 1 ? (isWork ? restTime : workTime) : prev - 1;
        }
        return prev - 1;
      });
    },
    isActive ? 1000 : null,
    [isActive, isWork, workTime, restTime]
  );

  useTimer(
    () => {
      setSessionTime((prev) => {
        if (prev >= totalDuration * 60) {
          setIsActive(false);
          return prev;
        }
        return prev + 1;
      });
    },
    isActive ? 1000 : null,
    [isActive, totalDuration]
  );

  const CIRCLE_SIZE = 384; // Total size of the circle
  const CIRCLE_RADIUS = 186; // Radius accounting for stroke alignment
  const STROKE_WIDTH = 8; // Stroke width of the circle
  const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <div className="absolute top-4 left-4 text-2xl font-mono">
        {formatTime(sessionTime)} / {formatTime(totalDuration * 60)}
      </div>

      <div className="flex flex-col items-center justify-center space-y-8">
        {isPreparing ? (
          <div className="text-6xl font-bold">Get Ready: {prepTime}</div>
        ) : (
          <div className="relative">
            <div className="relative w-96 h-96">
              <div 
                className="absolute inset-0 rounded-full border-8" 
                style={{ borderColor: textColor }}
              />
              <div className="absolute inset-0">
                <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${CIRCLE_SIZE} ${CIRCLE_SIZE}`}>
                  <circle
                    cx={CIRCLE_SIZE / 2}
                    cy={CIRCLE_SIZE / 2}
                    r={CIRCLE_RADIUS}
                    strokeWidth={STROKE_WIDTH}
                    stroke={isWork ? workColor : restColor}
                    fill="none"
                    strokeDasharray={CIRCLE_CIRCUMFERENCE}
                    strokeDashoffset={`${(CIRCLE_CIRCUMFERENCE * (100 - calculateProgress(currentTime, isWork ? workTime : restTime))) / 100}`}
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-7xl font-bold mb-2">{currentTime}</div>
                <div className="text-4xl font-bold">
                  {isWork ? 'WORK' : 'REST'}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex space-x-4">
          <button
            onClick={toggleTimer}
            className="p-4 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors"
          >
            {isActive ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <button
            onClick={resetTimer}
            className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
          >
            <RotateCcw size={24} />
          </button>
        </div>
      </div>

      {/* Settings Button */}
      <button
        onClick={() => setShowSettings(true)}
        className="fixed bottom-4 right-4 p-4 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
      >
        <Settings className="w-6 h-6" />
      </button>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-white text-black max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Timer Settings</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            {/* Timer Settings */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Timer Settings</h3>
              <TimerSetting
                label="Work Time"
                value={workTime}
                onChange={setWorkTime}
              />
              <TimerSetting
                label="Rest Time"
                value={restTime}
                onChange={setRestTime}
              />
              <TimerSetting
                label="Total Duration (minutes)"
                value={totalDuration}
                onChange={setTotalDuration}
                max={60}
              />
              <TimerSetting
                label="Preparation Time"
                value={prepareTime}
                onChange={setPrepareTime}
                max={10}
              />
            </div>

            {/* Color Settings */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Color Settings</h3>
              <ColorPicker
                label="Work Color"
                color={workColor}
                onChange={setWorkColor}
              />
              <ColorPicker
                label="Rest Color"
                color={restColor}
                onChange={setRestColor}
              />
              <ColorPicker
                label="Background Color"
                color={bgColor}
                onChange={setBgColor}
              />
              <ColorPicker
                label="Text Color"
                color={textColor}
                onChange={setTextColor}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkoutTimer;

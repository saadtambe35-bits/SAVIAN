import React from 'react';

/**
 * High-Precision Mechanical Rolling Digit Indicator
 * Designed for Railway Operations telemetry displays.
 * Animates numbers like physical airport/station roll indicators or precision odometers.
 * Guaranteed ZERO layout shift or baseline misalignment.
 */

interface RollingDigitProps {
  digit: string;
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

const RollingDigit: React.FC<RollingDigitProps> = ({ digit }) => {
  const isNumber = /^[0-9]$/.test(digit);

  if (!isNumber) {
    return <span className="inline-block whitespace-pre">{digit}</span>;
  }

  const num = parseInt(digit, 10);

  return (
    <span
      className="inline-block overflow-hidden relative select-none"
      style={{
        height: '1.25em',
        lineHeight: '1.25em',
        verticalAlign: '-0.12em',
        width: '0.62em',
        textAlign: 'center',
      }}
    >
      <span
        className="inline-flex flex-col transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1)"
        style={{
          transform: `translateY(-${num * 10}%)`,
        }}
      >
        {DIGITS.map((n) => (
          <span
            key={n}
            className="inline-block text-center font-mono tabular-nums leading-none flex items-center justify-center"
            style={{ height: '1.25em', lineHeight: '1.25em' }}
          >
            {n}
          </span>
        ))}
      </span>
    </span>
  );
};

export interface RollingNumberProps {
  value: string | number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export const RollingNumber: React.FC<RollingNumberProps> = ({
  value,
  className = '',
  prefix = '',
  suffix = '',
}) => {
  const str = String(value);

  return (
    <span className={`inline-flex items-baseline font-mono tabular-nums ${className}`}>
      {prefix && <span className="whitespace-pre">{prefix}</span>}
      {str.split('').map((char, index) => (
        <RollingDigit key={`${index}-${char}`} digit={char} />
      ))}
      {suffix && <span className="whitespace-pre">{suffix}</span>}
    </span>
  );
};

export default RollingNumber;

import React, {useState} from 'react';
import {Controller, Control, useFormContext} from 'react-hook-form';
import {DownIcon} from '../../../icons';

interface Option {
  value: string;
  label: string;
}

interface GenericDropdownProps {
  name: string;
  label?: string;
  options: Option[];
  defaultOption?: string;
  control?: Control<any>;
  disabled?: boolean;
  required?: boolean;
  onChange?: (value: string) => void;
}

const GenericDropdown: React.FC<GenericDropdownProps> = ({
  name,
  label,
  options,
  defaultOption = '',
  control,
  disabled = false,
  required = false,
  onChange: onCustomChange,
}) => {
  const formContext = useFormContext();
  const effectiveControl = control || formContext?.control;

  return (
    <Controller
      name={name}
      control={effectiveControl}
      defaultValue=""
      rules={required ? {required: `${label ?? name} is required`} : undefined}
      render={({
        field: {onChange, onBlur, value, name: fieldName},
        fieldState: {error},
      }) => (
        <div className="w-full font-['Roboto',Helvetica,Arial,sans-serif]">
          {label && (
            <label className="mb-1 block text-[14px] font-normal text-[#000000DE]">
              {label}
              <span className="text-[14px] font-bold text-red-600">
                &nbsp;{required && '*'}
              </span>
            </label>
          )}

          <div className="relative">
            <select
              name={fieldName}
              value={value ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                onChange(val);
                if (onCustomChange) {
                  onCustomChange(val);
                }
              }}
              onBlur={onBlur}
              disabled={disabled}
              aria-invalid={!!error}
              aria-describedby={error ? `${fieldName}-error` : undefined}
              className={`w-full appearance-none rounded border border-[#C4C4C4] bg-white px-3 py-2 text-[14px] text-[#000000DE] font-['Roboto',Helvetica,Arial,sans-serif] outline-none transition focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3] disabled:cursor-default disabled:bg-gray-100 ${error ? '!border-red-500' : ''}`}
            >
              <option value="" disabled hidden>
                {defaultOption || `Select ${label || fieldName}`}
              </option>
              {options?.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="text-[#000000DE]"
                >
                  {option.label}
                </option>
              ))}
            </select>

            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
              <DownIcon />
            </span>
          </div>

          {error && (
            <p id={`${fieldName}-error`} className="mt-1 text-xs text-red-600">
              {error.message}
            </p>
          )}
        </div>
      )}
    />
  );
};

export default GenericDropdown;

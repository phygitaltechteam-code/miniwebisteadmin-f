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
        <div className="w-full">
          {label && (
            <label className="mb-2 block text-black dark:text-white">
              {label}
              <span className="text-lg font-bold text-red-600">
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
              className={`w-full appearance-none rounded-md border px-2 py-2.5 text-sm outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary dark:disabled:bg-black ${error ? 'border-red-500' : 'border-stroke'} `}
            >
              <option value="" disabled hidden>
                {defaultOption || `Select ${label || fieldName}`}
              </option>
              {options?.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="text-black dark:text-white"
                >
                  {option.label}
                </option>
              ))}
            </select>

            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              <DownIcon />
            </span>
          </div>

          {error && (
            <p id={`${fieldName}-error`} className="mt-1 text-sm text-red-600">
              {error.message}
            </p>
          )}
        </div>
      )}
    />
  );
};

export default GenericDropdown;

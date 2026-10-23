import React from 'react';
import { useFormContext, RegisterOptions } from 'react-hook-form';

interface InputProps {
  name?: string;
  label?: string;
  type?: string;
  placeholder?: string;
  validation?: RegisterOptions;
  disabled?: boolean;
  defaultValue?: string | number;
  required?: boolean;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  inputClassName?: string;
  prefix?: React.ReactNode;
}

const GenericInputField: React.FC<InputProps> = ({
  name = '',
  label,
  type = 'text',
  placeholder,
  validation,
  disabled = false,
  defaultValue,
  required = false,
  value,
  onChange,
  className = '',
  inputClassName = '',
  prefix,
}) => {
  let formContext: any = null;
  try {
    formContext = useFormContext();
  } catch {
    formContext = null;
  }

  const isRHF = formContext && name && value === undefined;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e);
    } else if (isRHF && type === 'number') {
      formContext.setValue(name, Number(e.target.value));
    }
  };

  const errorMessage =
    isRHF && formContext?.formState?.errors?.[name]?.message
      ? String(formContext.formState.errors[name].message)
      : undefined;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-200">
          {label}
          {required && <span className="text-sm font-bold text-red-500">&nbsp;*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {prefix && (
          <div className="absolute left-3 flex items-center pointer-events-none text-gray-400">
            {prefix}
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          className={`w-full rounded-xl border border-stroke bg-white py-2.5 text-xs text-black outline-none transition focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/25 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-strokedark dark:bg-boxdark dark:text-white dark:focus:border-[#2563EB] ${
            prefix ? 'pl-9 pr-3.5' : 'px-3.5'
          } ${inputClassName}`}
          disabled={disabled}
          defaultValue={defaultValue}
          {...(isRHF ? formContext.register(name, validation) : {})}
          value={value}
          onChange={handleInputChange}
        />
      </div>

      {errorMessage && (
        <p className="mt-1 text-xs text-red-500 font-medium">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default GenericInputField;

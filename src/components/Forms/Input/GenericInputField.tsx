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
  maxLength?: number;
  inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
  pattern?: string;
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
  maxLength,
  inputMode,
  pattern,
}) => {
  let formContext: any = null;
  try {
    formContext = useFormContext();
  } catch {
    formContext = null;
  }

  const isRHF = formContext && name && value === undefined;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isPhoneField = type === 'tel' || name.toLowerCase().includes('phone');
    if (isPhoneField) {
      const digitsOnly = e.target.value.replace(/\D/g, '');
      const limit = maxLength || 10;
      const cleanVal = digitsOnly.slice(0, limit);
      e.target.value = cleanVal;
      if (isRHF) {
        formContext.setValue(name, cleanVal, { shouldValidate: true, shouldDirty: true });
      }
    } else if (maxLength && e.target.value.length > maxLength) {
      e.target.value = e.target.value.slice(0, maxLength);
    }

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
    <div className={`w-full font-['Roboto',Helvetica,Arial,sans-serif] ${className}`}>
      {label && (
        <label className="mb-1 block text-[14px] font-normal text-[#000000DE]">
          {required ? label.replace(/\s*\*+$/, '') : label}
          {required && <span className="text-[14px] font-bold text-red-500">&nbsp;*</span>}
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
          maxLength={maxLength || (type === 'tel' || name.toLowerCase().includes('phone') ? 10 : undefined)}
          inputMode={inputMode || (type === 'tel' || name.toLowerCase().includes('phone') ? 'numeric' : undefined)}
          pattern={pattern || (type === 'tel' || name.toLowerCase().includes('phone') ? '[0-9]*' : undefined)}
          className={`w-full rounded border border-[#C4C4C4] bg-white py-2 text-[14px] text-[#000000DE] font-['Roboto',Helvetica,Arial,sans-serif] outline-none transition placeholder:text-[#9E9E9E] placeholder:text-[14px] focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3] disabled:cursor-not-allowed disabled:bg-gray-100 ${
            prefix ? 'pl-9 pr-3' : 'px-3'
          } ${inputClassName}`}
          disabled={disabled}
          defaultValue={defaultValue}
          {...(isRHF ? formContext.register(name, validation) : {})}
          value={value}
          onChange={handleInputChange}
        />
      </div>

      {errorMessage && (
        <p className="mt-1 text-xs text-red-500 font-normal">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default GenericInputField;

import React from 'react';
import { useFormContext, RegisterOptions } from 'react-hook-form';

interface TextAreaProps {
  name?: string;
  label?: string;
  placeholder?: string;
  validation?: RegisterOptions;
  rows?: number;
  disabled?: boolean;
  required?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
  inputClassName?: string;
}

const GenericTextArea: React.FC<TextAreaProps> = ({
  name = '',
  label,
  placeholder,
  validation,
  rows = 3,
  disabled = false,
  required = false,
  value,
  onChange,
  className = '',
  inputClassName = '',
}) => {
  let formContext: any = null;
  try {
    formContext = useFormContext();
  } catch {
    formContext = null;
  }

  const isRHF = formContext && name && value === undefined;
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
      <textarea
        rows={rows}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-stroke bg-white px-3.5 py-2.5 text-xs text-black outline-none transition focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/25 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-strokedark dark:bg-boxdark dark:text-white dark:focus:border-[#2563EB] ${inputClassName}`}
        disabled={disabled}
        {...(isRHF ? formContext.register(name, validation) : {})}
        value={value}
        onChange={onChange}
      />
      {errorMessage && (
        <p className="mt-1 text-xs text-red-500 font-medium">{errorMessage}</p>
      )}
    </div>
  );
};

export default GenericTextArea;

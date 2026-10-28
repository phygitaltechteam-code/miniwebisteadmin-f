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
    <div className={`w-full font-['Roboto',Helvetica,Arial,sans-serif] ${className}`}>
      {label && (
        <label className="mb-1.5 block text-[14px] font-normal text-[#000000DE]">
          {label}
          {required && <span className="text-[14px] font-bold text-red-500">&nbsp;*</span>}
        </label>
      )}
      <textarea
        rows={rows}
        placeholder={placeholder}
        className={`w-full rounded border border-[#C4C4C4] bg-white px-3 py-2 text-[14px] text-[#000000DE] font-['Roboto',Helvetica,Arial,sans-serif] outline-none transition placeholder:text-[#9E9E9E] placeholder:text-[14px] focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3] disabled:cursor-not-allowed disabled:bg-gray-100 resize-y ${inputClassName}`}
        disabled={disabled}
        {...(isRHF ? formContext.register(name, validation) : {})}
        value={value}
        onChange={onChange}
      />
      {errorMessage && (
        <p className="mt-1 text-xs text-red-500 font-normal">{errorMessage}</p>
      )}
    </div>
  );
};

export default GenericTextArea;

// frontend/src/components/common/Select.tsx
import React, { forwardRef } from 'react';

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  helperText?: string;
  error?: string;
  fullWidth?: boolean;
  options: Option[];
  onChange?: (value: string) => void;
  containerClassName?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  helperText,
  error,
  fullWidth = false,
  options,
  onChange,
  className = '',
  containerClassName = '',
  ...rest
}, ref) => {
  // Base styles
  const baseStyles = `
    border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    ${error ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'}
    bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
  `;
  
  // Size styles
  const sizeStyles = 'px-3 py-2';
  
  // Width styles
  const widthStyles = fullWidth ? 'w-full' : '';

  // Handle change
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
      {label && (
        <label htmlFor={rest.id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      
      <select
        ref={ref}
        className={`
          ${baseStyles}
          ${sizeStyles}
          ${widthStyles}
          ${className}
        `}
        onChange={handleChange}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {(helperText || error) && (
        <p className={`mt-1 text-sm ${error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
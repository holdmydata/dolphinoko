// frontend/src/components/common/TextArea.tsx
import React, { forwardRef } from "react";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  fullWidth?: boolean;
  containerClassName?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      error,
      fullWidth = false,
      className = "",
      containerClassName = "",
      ...rest
    },
    ref
  ) => {
    // Base styles
    const baseStyles =
      "border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

    // Size styles
    const sizeStyles = "px-3 py-2";

    // Width styles
    const widthStyles = fullWidth ? "w-full" : "";

    return (
      <div className={`${fullWidth ? "w-full" : ""} ${containerClassName}`}>
        {label && (
          <label
            htmlFor={rest.id}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          className={`
          ${baseStyles}
          ${sizeStyles}
          ${widthStyles}
          ${className}
        `}
          {...rest}
        />

        {(helperText || error) && (
          <p
            className={`mt-1 text-sm ${
              error
                ? "text-red-600 dark:text-red-400"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  footer?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  noPadding?: boolean;
  border?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  footer,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  noPadding = false,
  border = true,
}) => {
  // Base styles
  const baseStyles = `
    bg-white rounded-lg shadow-md overflow-hidden
    ${border ? 'border border-gray-200' : ''}
    ${className}
  `;
  
  // Header styles
  const headerStyles = `
    px-6 py-4 border-b border-gray-200
    ${headerClassName}
  `;
  
  // Body styles
  const bodyStyles = `
    ${noPadding ? '' : 'p-6'}
    ${bodyClassName}
  `;
  
  // Footer styles
  const footerStyles = `
    px-6 py-4 bg-gray-50 border-t border-gray-200
    ${footerClassName}
  `;

  return (
    <div className={baseStyles}>
      {title && (
        <div className={headerStyles}>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
      )}
      
      <div className={bodyStyles}>
        {children}
      </div>
      
      {footer && (
        <div className={footerStyles}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
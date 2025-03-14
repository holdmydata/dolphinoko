import React from 'react';
import { styles, cx } from '../../utils/theme';

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
  // Base styles with border option
  const baseStyles = cx(
    styles.card.container,
    !border && 'border-0',
    className
  );
  
  return (
    <div className={baseStyles}>
      {title && (
        <div className={cx(styles.card.header, headerClassName)}>
          <h3 className={styles.text.primary + " text-lg font-medium"}>{title}</h3>
        </div>
      )}
      
      <div className={cx(noPadding ? '' : 'p-6', bodyClassName)}>
        {children}
      </div>
      
      {footer && (
        <div className={cx(styles.card.footer, footerClassName)}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
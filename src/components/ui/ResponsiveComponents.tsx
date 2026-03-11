/**
 * Composants UI responsive optimisés
 * Phase 3.4 - Expérience utilisateur
 * 
 * Date: 10 mars 2025
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

// Grid responsive
interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = 3,
  gap = 'md',
  className
}) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  };

  const gapClasses = {
    sm: 'gap-2 sm:gap-3',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8'
  };

  return (
    <div className={cn('grid', gridClasses[cols], gapClasses[gap], className)}>
      {children}
    </div>
  );
};

// Card responsive
interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  className,
  hover = false,
  padding = 'md'
}) => {
  const paddingClasses = {
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  };

  return (
    <motion.div
      whileHover={hover ? { scale: 1.02 } : undefined}
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm sm:shadow-md',
        paddingClasses[padding],
        hover && 'hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all',
        className
      )}
    >
      {children}
    </motion.div>
  );
};

// Button responsive
interface ResponsiveButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  fullWidthMobile?: boolean;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const ResponsiveButton: React.FC<ResponsiveButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  fullWidthMobile = false,
  className,
  onClick,
  disabled = false
}) => {
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    outline: 'border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm sm:px-4 sm:py-2',
    md: 'px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base',
    lg: 'px-6 py-3 text-base sm:px-8 sm:py-4 sm:text-lg'
  };

  const widthClasses = fullWidth 
    ? 'w-full' 
    : fullWidthMobile 
      ? 'w-full sm:w-auto' 
      : '';

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        variantClasses[variant],
        sizeClasses[size],
        widthClasses,
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </motion.button>
  );
};

// Input responsive
interface ResponsiveInputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const ResponsiveInput: React.FC<ResponsiveInputProps> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  label,
  error,
  disabled = false,
  className
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={cn(
          'w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-red-500 focus:ring-red-500',
          className
        )}
      />
      {error && (
        <p className="mt-1 text-xs sm:text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};

// Modal responsive
interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md lg:max-w-lg',
    lg: 'max-w-lg lg:max-w-2xl',
    xl: 'max-w-2xl lg:max-w-4xl'
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={cn(
          'w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl',
          sizeClasses[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-4 sm:p-6">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Table responsive
interface ResponsiveTableProps {
  headers: string[];
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  headers,
  children,
  className
}) => {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <table className={cn('min-w-full divide-y divide-gray-200 dark:divide-gray-700', className)}>
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {children}
        </tbody>
      </table>
    </div>
  );
};

// Stats grid responsive
interface ResponsiveStatsProps {
  stats: Array<{
    label: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
  }>;
}

export const ResponsiveStats: React.FC<ResponsiveStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
            {stat.label}
          </p>
          <p className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            {stat.value}
          </p>
          {stat.change && (
            <p className={cn(
              'text-xs sm:text-sm mt-1',
              stat.trend === 'up' && 'text-green-600 dark:text-green-400',
              stat.trend === 'down' && 'text-red-600 dark:text-red-400',
              stat.trend === 'neutral' && 'text-gray-600 dark:text-gray-400'
            )}>
              {stat.change}
            </p>
          )}
        </motion.div>
      ))}
    </div>
  );
};

// Tabs responsive
interface ResponsiveTabsProps {
  tabs: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const ResponsiveTabs: React.FC<ResponsiveTabsProps> = ({
  tabs,
  activeTab,
  onTabChange
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap',
            activeTab === tab.id
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          )}
        >
          {tab.icon}
          <span className="hidden sm:inline">{tab.label}</span>
          <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
        </button>
      ))}
    </div>
  );
};

// Form responsive
interface ResponsiveFormProps {
  children: React.ReactNode;
  columns?: 1 | 2;
  className?: string;
}

export const ResponsiveForm: React.FC<ResponsiveFormProps> = ({
  children,
  columns = 1,
  className
}) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2'
  };

  return (
    <form className={cn('grid gap-4', gridClasses[columns], className)}>
      {children}
    </form>
  );
};

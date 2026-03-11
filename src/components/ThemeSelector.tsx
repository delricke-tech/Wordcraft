/**
 * Composant de sélection de thème
 * Phase 3.4 - Expérience utilisateur
 * 
 * Date: 10 mars 2025
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeSelectorProps {
  variant?: 'dropdown' | 'toggle' | 'switch';
  className?: string;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  variant = 'dropdown',
  className = ''
}) => {
  const { theme, setTheme, resolvedTheme, isDark } = useTheme();

  if (variant === 'toggle') {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${className}`}
        title={`Basculer vers le mode ${isDark ? 'clair' : 'sombre'}`}
      >
        <motion.div
          initial={false}
          animate={{ rotate: isDark ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {isDark ? (
            <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          ) : (
            <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          )}
        </motion.div>
      </motion.button>
    );
  }

  if (variant === 'switch') {
    return (
      <div className={`relative inline-flex items-center ${className}`}>
        <button
          onClick={() => setTheme('light')}
          className={`p-2 rounded-l-lg transition-colors ${
            theme === 'light' || (theme === 'system' && resolvedTheme === 'light')
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          <Sun className="w-4 h-4" />
        </button>
        <button
          onClick={() => setTheme('system')}
          className={`p-2 transition-colors border-x border-gray-300 dark:border-gray-600 ${
            theme === 'system'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          <Monitor className="w-4 h-4" />
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={`p-2 rounded-r-lg transition-colors ${
            theme === 'dark' || (theme === 'system' && resolvedTheme === 'dark')
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          <Moon className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Dropdown variant
  return (
    <div className={`relative ${className}`}>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
        className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
      >
        <option value="light">Clair</option>
        <option value="dark">Sombre</option>
        <option value="system">Système</option>
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <div className="w-4 h-4 text-gray-500 dark:text-gray-400">
          {theme === 'light' && <Sun className="w-full h-full" />}
          {theme === 'dark' && <Moon className="w-full h-full" />}
          {theme === 'system' && <Monitor className="w-full h-full" />}
        </div>
      </div>
    </div>
  );
};

// Composant pour les préférences de thème avancées
export const ThemePreferences: React.FC = () => {
  const { theme, setTheme, resolvedTheme, isDark } = useTheme();

  const themes = [
    {
      value: 'light' as const,
      label: 'Clair',
      description: 'Thème clair pour une utilisation diurne',
      icon: Sun,
      preview: 'bg-gradient-to-br from-blue-50 to-white'
    },
    {
      value: 'dark' as const,
      label: 'Sombre',
      description: 'Thème sombre pour réduire la fatigue oculaire',
      icon: Moon,
      preview: 'bg-gradient-to-br from-gray-900 to-black'
    },
    {
      value: 'system' as const,
      label: 'Système',
      description: 'S\'adapte automatiquement aux préférences de votre appareil',
      icon: Monitor,
      preview: isDark 
        ? 'bg-gradient-to-br from-gray-900 to-black' 
        : 'bg-gradient-to-br from-blue-50 to-white'
    }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Thème de l\'interface
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Choisissez le thème qui vous convient le mieux
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {themes.map((themeOption) => (
          <motion.button
            key={themeOption.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setTheme(themeOption.value)}
            className={`relative p-4 rounded-lg border-2 transition-all ${
              theme === themeOption.value
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className={`w-full h-16 rounded-md mb-3 ${themeOption.preview}`} />
            <div className="flex items-center gap-2 mb-2">
              <themeOption.icon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <span className="font-medium text-gray-900 dark:text-white">
                {themeOption.label}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 text-left">
              {themeOption.description}
            </p>
            {theme === themeOption.value && (
              <div className="absolute top-2 right-2 w-3 h-3 bg-blue-500 rounded-full" />
            )}
          </motion.button>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
          Thème actuellement actif
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {theme === 'system' 
            ? `Système (${resolvedTheme === 'dark' ? 'sombre' : 'clair'})`
            : theme === 'dark' 
              ? 'Sombre' 
              : 'Clair'
          }
        </p>
      </div>
    </div>
  );
};

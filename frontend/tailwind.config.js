// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './*.html',
    './**/*.html',
    './js/**/*.js',
    './assets/**/*.js'
  ],
  safelist: [
    'bg-purple-100',
    'text-purple-800',
    'bg-blue-100',
    'text-blue-800',
    'bg-gray-100',
    'text-gray-800',
    'bg-green-100',
    'text-green-800',
    'bg-red-100',
    'text-red-800',
    'text-red-600',
    'hover:text-red-900',
    'text-green-600',
    'hover:text-green-900',
    'z-10',
    'bg-blue-50',
    'border-blue-500',
    'text-blue-600',
    'bg-white',
    'border-gray-300',
    'text-gray-500',
    'hover:bg-gray-50'
  ],
  theme: {
    extend: {}
  },
  plugins: []
};

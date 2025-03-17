/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  mode: 'jit',
  safelist: [
    'bg-gray-50', 'bg-gray-100', 'bg-gray-200',
    'bg-indigo-500', 'bg-indigo-600', 'hover:bg-indigo-700',
    'bg-red-500', 'bg-red-600', 'hover:bg-red-700',
    'bg-green-500', 'bg-green-600', 'hover:bg-green-700',
    'shadow-md', 'shadow-lg',
    'p-1', 'p-2', 'p-3', 'p-4', 'p-6',
    'rounded', 'rounded-md', 'rounded-lg',
    'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl',
    'transition-all', 'duration-200', 'ease-in-out',
    // Colors
    'text-indigo-600', 'text-green-600', 'text-red-600',
    'text-blue-500',
    'text-gray-500', 'text-gray-600', 'text-gray-700', 'text-gray-800', 'text-gray-900',
    'border-blue-500', 'border-indigo-600', 'border-green-600', 'border-red-600',
    
    // Shadows and rounding
    'shadow', 'shadow-md', 'shadow-lg',
    'rounded', 'rounded-lg', 'rounded-full',
    
    // Spacing
    'px-1', 'px-2', 'px-3', 'px-4', 'px-5', 'px-6',
    'py-1', 'py-2', 'py-3', 'py-4', 'py-5', 'py-6',
    'm-1', 'm-2', 'm-3', 'm-4', 'm-5', 'm-6',
    'mx-1', 'mx-2', 'mx-3', 'mx-4', 'mx-5', 'mx-6',
    'my-1', 'my-2', 'my-3', 'my-4', 'my-5', 'my-6',
    'mt-1', 'mt-2', 'mt-3', 'mt-4', 'mt-5', 'mt-6',
    'mb-1', 'mb-2', 'mb-3', 'mb-4', 'mb-5', 'mb-6',
    
    // Layout
    'flex', 'flex-col', 'flex-row',
    'items-center', 'items-start', 'items-end',
    'justify-center', 'justify-between', 'justify-start', 'justify-end',
    'w-full', 'h-full', 'min-h-screen',
    
    // Typography
    'text-white', 'font-medium', 'font-bold',

    // Transitions
    'transition-all', 'duration-200',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-in-out',
      },
    },
  },
  variants: {
    extend: {
      backgroundColor: ['hover', 'focus', 'active'],
      textColor: ['hover', 'focus', 'active'],
      borderColor: ['hover', 'focus', 'active'],
      opacity: ['hover', 'focus', 'active', 'disabled'],
      cursor: ['hover', 'focus', 'disabled'],
    },
  },
  plugins: [],
} 
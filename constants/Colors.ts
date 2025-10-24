const tintColorLight = '#6366F1'; // A more vibrant primary color
const tintColorDark = '#A5B4FC'; // A lighter primary for dark mode

export const Colors = {
  light: {
    text: '#111827', // Almost black
    background: '#FFFFFF',
    tint: tintColorLight,
    icon: '#6B7280', // Medium gray
    tabIconDefault: '#9CA3AF', // Lighter gray
    tabIconSelected: tintColorLight,
    card: '#FFFFFF', // Card background
    cardBorder: '#E5E7EB', // Light border for cards
    primary: '#6366F1', // Primary button/accent color
    secondary: '#F3F4F6', // Secondary backgrounds, inputs
    danger: '#EF4444',
  },
  dark: {
    text: '#ECEDEE', // Off-white
    background: '#121212', // True dark background
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    card: '#1F2937', // Dark gray for cards
    cardBorder: '#374151', // Border for dark cards
    primary: '#A5B4FC', // Lighter primary for dark mode
    secondary: '#374151', // Darker gray for inputs
    danger: '#F87171',
  },
};
import '@testing-library/jest-dom/vitest'

// No need to mock react-native - vitest.config.ts aliases it to react-native-web
// which provides all the components we need (View, Text, Pressable, etc.)

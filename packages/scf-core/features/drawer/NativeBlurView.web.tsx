// Stub so the web bundle never loads expo-blur's native module.
// GlassTabBar renders GlassSurface on web and never calls BlurView, but
// a static import would still trigger RN Web's "Unimplemented component" warning.
export { View as BlurView } from 'react-native'

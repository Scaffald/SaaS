/**
 * Simple icon components for playground examples
 * These are placeholder icons matching Figma design patterns
 * Using Text-based icons for React Native compatibility
 */

import { View, Text, StyleSheet } from 'react-native'

interface IconProps {
  size: number
  color: string
}

// Simple placeholder icons using Unicode symbols
// In production, these would be replaced with proper icon libraries
export function CloudDownloadIcon({ size, color }: IconProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Text style={[styles.icon, { fontSize: size * 0.7, color }]}>⬇</Text>
    </View>
  )
}

export function HeartIcon({ size, color }: IconProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Text style={[styles.icon, { fontSize: size * 0.7, color }]}>♥</Text>
    </View>
  )
}

export function AlignTopIcon({ size, color }: IconProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Text style={[styles.icon, { fontSize: size * 0.7, color }]}>⊤</Text>
    </View>
  )
}

export function AlignCenterIcon({ size, color }: IconProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Text style={[styles.icon, { fontSize: size * 0.7, color }]}>☰</Text>
    </View>
  )
}

export function AlignBottomIcon({ size, color }: IconProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Text style={[styles.icon, { fontSize: size * 0.7, color }]}>⊥</Text>
    </View>
  )
}

export function MinusIcon({ size, color }: IconProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Text style={[styles.icon, { fontSize: size * 0.8, color }]}>−</Text>
    </View>
  )
}

export function PlusIcon({ size, color }: IconProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Text style={[styles.icon, { fontSize: size * 0.8, color }]}>+</Text>
    </View>
  )
}

export function ArrowSeparateVerticalIcon({ size, color }: IconProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Text style={[styles.icon, { fontSize: size * 0.7, color }]}>⇅</Text>
    </View>
  )
}

export function ZoomInIcon({ size, color }: IconProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Text style={[styles.icon, { fontSize: size * 0.7, color }]}>⊕</Text>
    </View>
  )
}

export function ZoomOutIcon({ size, color }: IconProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Text style={[styles.icon, { fontSize: size * 0.7, color }]}>⊖</Text>
    </View>
  )
}

export function MailIcon({ size, color }: IconProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Text style={[styles.icon, { fontSize: size * 0.7, color }]}>✉</Text>
    </View>
  )
}

export function EyeIcon({ size, color }: IconProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Text style={[styles.icon, { fontSize: size * 0.7, color }]}>👁</Text>
    </View>
  )
}

export function InfoIcon({ size, color }: IconProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Text style={[styles.icon, { fontSize: size * 0.7, color }]}>ℹ</Text>
    </View>
  )
}

export function CreditCardIcon({ size, color }: IconProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Text style={[styles.icon, { fontSize: size * 0.7, color }]}>💳</Text>
    </View>
  )
}

export function CloseIcon({ size, color }: IconProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Text style={[styles.icon, { fontSize: size * 0.6, color }]}>✕</Text>
    </View>
  )
}

export function ArrowDownIcon({ size, color }: IconProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Text style={[styles.icon, { fontSize: size * 0.7, color }]}>⌄</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    textAlign: 'center',
    lineHeight: undefined,
  },
})

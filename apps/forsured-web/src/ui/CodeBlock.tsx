/**
 * CodeBlock component
 * Custom component for code display with copy functionality
 *
 * Note: Beyond UI doesn't have a direct CodeBlock equivalent,
 * so this uses Beyond UI primitives for the implementation.
 */
import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { View, Text as RNText, Pressable, StyleSheet, Platform } from 'react-native'
import { Stack, Row, Button, Text, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui'

export interface CodeBlockProps {
  code: string
  language?: string
  showLineNumbers?: boolean
  className?: string
}

export default function CodeBlock({
  code,
  language = 'tsx',
  showLineNumbers = false,
  className = '',
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const { theme } = useThemeContext()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  const lines = code.split('\n')

  const styles = StyleSheet.create({
    container: {
      position: 'relative',
    },
    copyButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      zIndex: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: theme === 'dark' ? colors.gray[700] : colors.gray[800],
      borderRadius: 6,
      opacity: isHovered ? 1 : 0,
    },
    copyButtonText: {
      color: '#fff',
      fontSize: 12,
    },
    wrapper: {
      backgroundColor: theme === 'dark' ? colors.gray[900] : colors.gray[900],
      borderRadius: 8,
      overflow: 'hidden',
    },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: theme === 'dark' ? colors.gray[800] : colors.gray[800],
      borderBottomWidth: 1,
      borderBottomColor: theme === 'dark' ? colors.gray[700] : colors.gray[700],
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerText: {
      fontSize: 12,
      color: colors.gray[400],
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    content: {
      overflowX: 'auto' as any,
    },
    pre: {
      padding: 16,
    },
    codeLine: {
      flexDirection: 'row',
      width: '100%',
    },
    lineNumber: {
      paddingRight: 16,
      textAlign: 'right',
      color: colors.gray[600],
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 14,
      minWidth: 32,
    },
    lineContent: {
      color: colors.gray[200],
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 14,
    },
    codeText: {
      color: colors.gray[200],
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 14,
    },
  })

  return (
    <View
      style={styles.container}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Pressable onPress={handleCopy} style={styles.copyButton}>
        {copied ? (
          <>
            <Check size={14} color="#fff" />
            <RNText style={styles.copyButtonText}>Copied!</RNText>
          </>
        ) : (
          <>
            <Copy size={14} color="#fff" />
            <RNText style={styles.copyButtonText}>Copy</RNText>
          </>
        )}
      </Pressable>
      <View style={styles.wrapper}>
        <View style={styles.header}>
          <RNText style={styles.headerText}>{language}</RNText>
        </View>
        <View style={styles.content}>
          <View style={styles.pre}>
            {showLineNumbers ? (
              <View>
                {lines.map((line, index) => (
                  <View key={index} style={styles.codeLine}>
                    <RNText style={styles.lineNumber}>{index + 1}</RNText>
                    <RNText style={styles.lineContent}>{line || ' '}</RNText>
                  </View>
                ))}
              </View>
            ) : (
              <RNText style={styles.codeText}>{code}</RNText>
            )}
          </View>
        </View>
      </View>
    </View>
  )
}

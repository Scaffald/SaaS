/**
 * Rich Text Editor - Web Implementation
 * Uses TipTap for web browsers
 */

import { Bold, Italic, List, ListOrdered, Underline as UnderlineIcon } from '@tamagui/lucide-icons'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useMemo } from 'react'
import { Button, Text, XStack, YStack } from 'tamagui'
import type { RichTextEditorProps } from './types'
import { RICH_TEXT_LIMITS, RICH_TEXT_PLACEHOLDERS } from './utils/constants'
import { createEmptyDocument, extractPlainText, sanitizeTipTapJSON } from './utils/sanitize'

/**
 * Toolbar button component
 */
interface ToolbarButtonProps {
  icon: typeof Bold
  label: string
  isActive?: boolean
  disabled?: boolean
  onPress: () => void
}

const ToolbarButtonComponent = ({
  icon: Icon,
  label,
  isActive,
  disabled,
  onPress,
}: ToolbarButtonProps) => (
  <Button
    size="$3"
    chromeless
    onPress={onPress}
    disabled={disabled}
    background={isActive ? '$blue4' : 'transparent'}
    hoverStyle={{
      background: isActive ? '$blue5' : '$gray3',
    }}
    pressStyle={{
      background: isActive ? '$blue6' : '$gray4',
    }}
    aria-label={label}
    icon={<Icon size="$1" />}
  />
)

/**
 * Editor container styles
 * Note: We need to inject CSS for .ProseMirror since Tamagui doesn't support nested selectors
 */
const editorStyles = `
  .rich-text-editor-container .ProseMirror {
    padding: 12px;
    min-height: 100%;
    height: 100%;
    outline: none;
    cursor: text;
    font-family: var(--font-family, 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
    font-size: 16px;
    line-height: 1.5;
    color: inherit;
    overflow-y: auto;
  }

  .rich-text-editor-container .ProseMirror p.is-editor-empty:first-child::before {
    color: #adb5bd;
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }

  .rich-text-editor-container.disabled .ProseMirror {
    background-color: #f1f3f5;
    cursor: not-allowed;
  }
`

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('rich-text-editor-styles')) {
  const styleTag = document.createElement('style')
  styleTag.id = 'rich-text-editor-styles'
  styleTag.textContent = editorStyles
  document.head.appendChild(styleTag)
}

/**
 * Character count display
 */
const CharacterCount = ({ current, max }: { current: number; max: number }) => {
  const isNearLimit = current > max * 0.9
  const isOverLimit = current > max

  return (
    <Text
      fontSize="$2"
      color={isOverLimit ? '$red10' : isNearLimit ? '$yellow10' : '$color'}
      px="$3"
      py="$2"
    >
      {current} / {max}
    </Text>
  )
}

/**
 * Rich Text Editor - Web Implementation
 */
export function RichTextEditor({
  value,
  onChange,
  fieldType,
  placeholder: customPlaceholder,
  maxLength: customMaxLength,
  disabled = false,
  readOnly = false,
  showCharacterCount = true,
  autoFocus = false,
  minHeight = 120,
  error,
  testID,
}: RichTextEditorProps) {
  const maxLength = customMaxLength ?? RICH_TEXT_LIMITS[fieldType]
  const placeholder =
    customPlaceholder ??
    (fieldType in RICH_TEXT_PLACEHOLDERS
      ? RICH_TEXT_PLACEHOLDERS[fieldType as keyof typeof RICH_TEXT_PLACEHOLDERS]
      : 'Enter text...')

  // Initialize editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable features we don't want
        heading: false,
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
      }),
      Underline,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value ?? createEmptyDocument(),
    editable: !disabled && !readOnly,
    autofocus: autoFocus,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON()
      const sanitized = sanitizeTipTapJSON(json)
      const plainText = extractPlainText(sanitized)

      // Enforce character limit
      if (plainText.length <= maxLength) {
        onChange?.(sanitized)
      }
    },
  })

  // Update content when value changes externally
  useEffect(() => {
    if (editor && value !== undefined) {
      const currentContent = editor.getJSON()
      const newContent = value ?? createEmptyDocument()

      // Only update if content actually changed
      if (JSON.stringify(currentContent) !== JSON.stringify(newContent)) {
        editor.commands.setContent(newContent)
      }
    }
  }, [editor, value])

  // Update editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled && !readOnly)
    }
  }, [editor, disabled, readOnly])

  const characterCount = useMemo(() => {
    if (!editor) return 0
    return extractPlainText(editor.getJSON()).length
  }, [editor, editor?.state.doc])

  if (!editor) {
    return null
  }

  const resolvedHeight = Math.max(minHeight ?? 150, 120)

  const handleContainerPointerDown = () => {
    if (disabled || readOnly) {
      return
    }
    editor.chain().focus().run()
  }

  return (
    <YStack
      borderWidth={1}
      borderColor={error ? '$red9' : '$borderColor'}
      rounded="$4"
      background="$background"
      overflow="hidden"
      opacity={disabled ? 0.6 : 1}
      cursor={disabled ? 'not-allowed' : undefined}
      testID={testID}
    >
      {/* Toolbar */}
      {!readOnly && (
        <XStack
          borderBottomWidth={1}
          borderColor="$borderColor"
          px="$2"
          py="$2"
          gap="$1"
          background="$gray2"
        >
          <ToolbarButtonComponent
            icon={Bold}
            label="Bold"
            isActive={editor.isActive('bold')}
            disabled={disabled}
            onPress={() => editor.chain().focus().toggleBold().run()}
          />
          <ToolbarButtonComponent
            icon={Italic}
            label="Italic"
            isActive={editor.isActive('italic')}
            disabled={disabled}
            onPress={() => editor.chain().focus().toggleItalic().run()}
          />
          <ToolbarButtonComponent
            icon={UnderlineIcon}
            label="Underline"
            isActive={editor.isActive('underline')}
            disabled={disabled}
            onPress={() => editor.chain().focus().toggleUnderline().run()}
          />
          <XStack width={1} background="$borderColor" mx="$2" />
          <ToolbarButtonComponent
            icon={List}
            label="Bullet List"
            isActive={editor.isActive('bulletList')}
            disabled={disabled}
            onPress={() => editor.chain().focus().toggleBulletList().run()}
          />
          <ToolbarButtonComponent
            icon={ListOrdered}
            label="Numbered List"
            isActive={editor.isActive('orderedList')}
            disabled={disabled}
            onPress={() => editor.chain().focus().toggleOrderedList().run()}
          />
        </XStack>
      )}

      {/* Editor Content */}
      {/* TipTap EditorContent requires a div wrapper (not a textarea) for its contenteditable implementation.
          This is an architectural limitation of the TipTap library. */}
      <div
        style={{
          height: resolvedHeight,
          minHeight: resolvedHeight,
          maxHeight: resolvedHeight,
          flex: 1,
          width: '100%',
          cursor: disabled ? 'not-allowed' : 'text',
          overflowY: 'auto',
        }}
        className={`rich-text-editor-container${disabled ? ' disabled' : ''}`}
      >
        <EditorContent
          editor={editor}
          role="textbox"
          aria-label="Rich text editor"
          aria-multiline="true"
          tabIndex={-1}
          onMouseDown={handleContainerPointerDown}
        />
      </div>

      {/* Character Count */}
      {showCharacterCount && (
        <XStack borderTopWidth={1} borderColor="$borderColor" background="$gray1">
          <YStack flex={1} />
          <CharacterCount current={characterCount} max={maxLength} />
        </XStack>
      )}

      {/* Error Message */}
      {error && (
        <Text fontSize="$2" color="$red10" px="$3" pt="$2">
          {error}
        </Text>
      )}
    </YStack>
  )
}

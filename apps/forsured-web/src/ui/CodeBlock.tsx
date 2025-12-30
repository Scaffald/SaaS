import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { YStack, XStack, Text, Button, styled, useTheme } from '@unicornlove/ui';

export interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  className?: string;
}

const CodeBlockContainer = styled(YStack, {
  name: 'CodeBlockContainer',
  position: 'relative',
});

const CopyButton = styled(Button, {
  name: 'CodeBlockCopyButton',
  position: 'absolute',
  top: '$2',
  right: '$2',
  opacity: 0,
  zIndex: 10,
  alignItems: 'center',
  gap: '$1',
  paddingHorizontal: '$3',
  paddingVertical: '$1.5',
  backgroundColor: '$gray11',
  color: '$color1',
  fontSize: '$1',
  borderRadius: '$3',
  transition: 'opacity 0.2s ease-in-out',
  hoverStyle: {
    backgroundColor: '$gray10',
  },
});

const CodeBlockWrapper = styled(YStack, {
  name: 'CodeBlockWrapper',
  backgroundColor: '$gray12',
  borderRadius: '$4',
  overflow: 'hidden',
});

const CodeBlockHeader = styled(XStack, {
  name: 'CodeBlockHeader',
  paddingHorizontal: '$4',
  paddingVertical: '$2',
  backgroundColor: '$gray11',
  borderBottomWidth: 1,
  borderBottomColor: '$gray10',
  alignItems: 'center',
  justifyContent: 'space-between',
});

const CodeBlockContent = styled(YStack, {
  name: 'CodeBlockContent',
  overflowX: 'auto',
});

const CodePre = styled(YStack, {
  name: 'CodePre',
  padding: '$4',
  fontFamily: '$mono',
  fontSize: '$2',
  color: '$gray2',
});

const CodeLine = styled(XStack, {
  name: 'CodeLine',
  width: '100%',
});

const LineNumber = styled(Text, {
  name: 'CodeLineNumber',
  paddingRight: '$4',
  textAlign: 'right',
  color: '$gray7',
  userSelect: 'none',
  fontFamily: '$mono',
});

const LineContent = styled(Text, {
  name: 'CodeLineContent',
  color: '$gray2',
  fontFamily: '$mono',
});

export default function CodeBlock({
  code,
  language = 'tsx',
  showLineNumbers = false,
  className = '',
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const theme = useTheme();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const lines = code.split('\n');

  return (
    <CodeBlockContainer 
      className={className}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
    >
      <CopyButton onPress={handleCopy} style={{ opacity: isHovered ? 1 : 0 }}>
        {copied ? (
          <>
            <Check size={14} color={theme.color1.val} />
            <Text color="$color1">Copied!</Text>
          </>
        ) : (
          <>
            <Copy size={14} color={theme.color1.val} />
            <Text color="$color1">Copy</Text>
          </>
        )}
      </CopyButton>
      <CodeBlockWrapper>
        <CodeBlockHeader>
          <Text fontSize="$1" color="$gray7" fontFamily="$mono">
            {language}
          </Text>
        </CodeBlockHeader>
        <CodeBlockContent>
          <CodePre as="pre">
            {showLineNumbers ? (
              <YStack as="code" fontSize="$2" fontFamily="$mono" color="$gray2">
                {lines.map((line, index) => (
                  <CodeLine key={index}>
                    <LineNumber>{index + 1}</LineNumber>
                    <LineContent>{line || ' '}</LineContent>
                  </CodeLine>
                ))}
              </YStack>
            ) : (
              <Text as="code" fontSize="$2" fontFamily="$mono" color="$gray2">
                {code}
              </Text>
            )}
          </CodePre>
        </CodeBlockContent>
      </CodeBlockWrapper>
    </CodeBlockContainer>
  );
}

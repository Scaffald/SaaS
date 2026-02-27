// src/pages/docs/Components.tsx
import React from 'react';
import { Stack, Row, Box, Text, H1, H2, H3 } from '@scaffald/ui';

interface ComponentDocProps {
  name: string;
  description: string;
  props: { name: string; type: string; description: string; default?: string }[];
  examples: { title: string; code: string; render: React.ReactNode }[];
}

function ComponentDocumentationTemplate({ name, description, props, examples }: ComponentDocProps) {
  return (
    <Box style={{ padding: 'var(--space-6)' }}>
      <H1 style={{ fontSize: 'var(--font-size-9)', fontWeight: 'bold', marginBottom: 'var(--space-4)', color: 'var(--color-12)' }}>{name}</H1>
      <Text style={{ fontSize: 'var(--font-size-5)', color: 'var(--color-11)', marginBottom: 'var(--space-6)' }}>{description}</Text>

      <H2 style={{ fontSize: 'var(--font-size-7)', fontWeight: 600, marginBottom: 'var(--space-3)', color: 'var(--color-12)' }}>Props</H2>
      <Box
        style={{
          backgroundColor: 'var(--color-background)',
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: 'var(--color-border)',
          borderRadius: 'var(--radius-4)',
          marginBottom: 'var(--space-6)',
          overflow: 'hidden',
        }}
      >
        <Row
          style={{
            backgroundColor: 'var(--color-background-secondary)',
            borderBottomWidth: 1,
            borderBottomStyle: 'solid',
            borderBottomColor: 'var(--color-border)',
          }}
        >
          <Text style={{ flex: 1, paddingTop: 'var(--space-2)', paddingBottom: 'var(--space-2)', paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)', fontWeight: 600, color: 'var(--color-12)' }}>Name</Text>
          <Text style={{ flex: 1, paddingTop: 'var(--space-2)', paddingBottom: 'var(--space-2)', paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)', fontWeight: 600, color: 'var(--color-12)' }}>Type</Text>
          <Text style={{ flex: 2, paddingTop: 'var(--space-2)', paddingBottom: 'var(--space-2)', paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)', fontWeight: 600, color: 'var(--color-12)' }}>Description</Text>
          <Text style={{ flex: 1, paddingTop: 'var(--space-2)', paddingBottom: 'var(--space-2)', paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)', fontWeight: 600, color: 'var(--color-12)' }}>Default</Text>
        </Row>
        {props.map((prop, index) => (
          <Row
            key={index}
            style={{
              borderBottomWidth: index < props.length - 1 ? 1 : 0,
              borderBottomStyle: 'solid',
              borderBottomColor: 'var(--color-border)',
            }}
          >
            <Text style={{ flex: 1, paddingTop: 'var(--space-2)', paddingBottom: 'var(--space-2)', paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)', color: 'var(--color-12)' }}>{prop.name}</Text>
            <Text style={{ flex: 1, paddingTop: 'var(--space-2)', paddingBottom: 'var(--space-2)', paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)', color: 'var(--color-11)', fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-2)' }}>{prop.type}</Text>
            <Text style={{ flex: 2, paddingTop: 'var(--space-2)', paddingBottom: 'var(--space-2)', paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)', color: 'var(--color-11)' }}>{prop.description}</Text>
            <Text style={{ flex: 1, paddingTop: 'var(--space-2)', paddingBottom: 'var(--space-2)', paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)', color: 'var(--color-10)' }}>{prop.default || '-'}</Text>
          </Row>
        ))}
      </Box>

      <H2 style={{ fontSize: 'var(--font-size-7)', fontWeight: 600, marginBottom: 'var(--space-3)', color: 'var(--color-12)' }}>Examples</H2>
      {examples.map((example, index) => (
        <Box
          key={index}
          style={{
            marginBottom: 'var(--space-6)',
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: 'var(--color-border)',
            borderRadius: 'var(--radius-4)',
            padding: 'var(--space-4)',
            backgroundColor: 'var(--color-background)',
          }}
        >
          <H3 style={{ fontSize: 'var(--font-size-6)', fontWeight: 500, marginBottom: 'var(--space-3)', color: 'var(--color-12)' }}>{example.title}</H3>
          <Box
            style={{
              backgroundColor: 'var(--color-background-secondary)',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-3)',
              marginBottom: 'var(--space-3)',
            }}
          >
            <Text style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-2)', color: 'var(--color-11)', whiteSpace: 'pre-wrap' }}>
              {example.code}
            </Text>
          </Box>
          <Box
            style={{
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: 'var(--color-border)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-3)',
            }}
          >
            {example.render}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export default ComponentDocumentationTemplate;

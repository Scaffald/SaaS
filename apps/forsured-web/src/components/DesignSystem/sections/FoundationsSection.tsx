import React from 'react';
import { Stack, Row, Text, H1, H2, H3 } from '@unicornlove/beyond-ui';
import ComponentShowcase from '../ComponentShowcase';
import { Palette, Box as BoxIcon, Sun } from 'lucide-react';

export default function FoundationsSection() {
  const colorRamps = [
    { name: 'Primary (Blue)', base: '#0166FF', var: 'primary' },
    { name: 'Secondary (Orange)', base: '#F0A000', var: 'secondary' },
    { name: 'Tertiary (Yellow)', base: '#F2D200', var: 'tertiary' },
    { name: 'Success (Green)', base: '#22C55E', var: 'success' },
    { name: 'Warning (Amber)', base: '#F59E0B', var: 'warning' },
    { name: 'Error (Red)', base: '#EF4444', var: 'error' },
  ];

  const spacingScale = [
    { size: '0', value: '0px', class: 'p-0' },
    { size: '1', value: '4px', class: 'p-1' },
    { size: '2', value: '8px', class: 'p-2' },
    { size: '3', value: '12px', class: 'p-3' },
    { size: '4', value: '16px', class: 'p-4' },
    { size: '6', value: '24px', class: 'p-6' },
    { size: '8', value: '32px', class: 'p-8' },
    { size: '12', value: '48px', class: 'p-12' },
    { size: '16', value: '64px', class: 'p-16' },
  ];

  const shadows = [
    { name: 'Small', class: 'shadow-sm' },
    { name: 'Medium', class: 'shadow-md' },
    { name: 'Large', class: 'shadow-lg' },
    { name: 'Extra Large', class: 'shadow-xl' },
  ];

  return (
    <Stack style={{ gap: 'var(--space-8)', marginBottom: 'var(--space-12)' }}>
      <Row style={{ alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <Palette color="var(--blue10)" size={32} />
        <H2 style={{ fontSize: 'var(--font-size-9)', fontWeight: 'bold', color: 'var(--color-12)' }}>
          Foundations
        </H2>
      </Row>

      <ComponentShowcase
        title="Colors"
        description="Complete color palette with 100-900 weight scales for all brand colors"
      >
        <Row style={{ width: '100%', flexWrap: 'wrap', gap: 'var(--space-6)' }}>
          {colorRamps.map((color) => (
            <Stack key={color.var} style={{ gap: 'var(--space-2)', flex: 1, minWidth: 200 }}>
              <Row style={{ fontWeight: 600, color: 'var(--color-12)', marginBottom: 'var(--space-3)', alignItems: 'center', gap: 'var(--space-2)' }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 'var(--radius-2)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    backgroundColor: color.base,
                  }}
                />
                <Text>{color.name}</Text>
              </Row>
              <Stack style={{ gap: 'var(--space-1)' }}>
                {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((weight) => (
                  <Row key={weight} style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                    <div
                      style={{
                        width: 64,
                        height: 32,
                        borderRadius: 'var(--radius-2)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        border: '1px solid var(--color-border)',
                        backgroundColor: `rgb(var(--color-${color.var}-${weight}))`,
                      }}
                    />
                    <Text style={{ fontSize: 'var(--font-size-2)', fontFamily: 'var(--font-mono)', color: 'var(--color-11)' }}>
                      {weight}
                    </Text>
                  </Row>
                ))}
              </Stack>
            </Stack>
          ))}
        </Row>
      </ComponentShowcase>

      <ComponentShowcase
        title="Typography"
        description="Font families, sizes, and weights used throughout the system"
      >
        <Stack style={{ width: '100%', gap: 'var(--space-6)' }}>
          <div>
            <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 600, color: 'var(--color-11)', marginBottom: 'var(--space-3)' }}>
              Display Font (Rokkitt)
            </Text>
            <H1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-size-10)', fontWeight: 'bold', color: 'var(--color-12)' }}>
              The quick brown fox
            </H1>
            <H2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-size-9)', fontWeight: 'bold', color: 'var(--color-12)', marginTop: 'var(--space-2)' }}>
              The quick brown fox
            </H2>
            <H3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-size-8)', fontWeight: 'bold', color: 'var(--color-12)', marginTop: 'var(--space-2)' }}>
              The quick brown fox
            </H3>
          </div>
          <div>
            <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 600, color: 'var(--color-11)', marginBottom: 'var(--space-3)' }}>
              Body Font (Inter)
            </Text>
            <Text style={{ fontSize: 'var(--font-size-6)', color: 'var(--color-12)' }}>
              The quick brown fox jumps over the lazy dog
            </Text>
            <Text style={{ fontSize: 'var(--font-size-4)', color: 'var(--color-12)', marginTop: 'var(--space-2)' }}>
              The quick brown fox jumps over the lazy dog
            </Text>
            <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-12)', marginTop: 'var(--space-2)' }}>
              The quick brown fox jumps over the lazy dog
            </Text>
            <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-12)', marginTop: 'var(--space-2)' }}>
              The quick brown fox jumps over the lazy dog
            </Text>
          </div>
        </Stack>
      </ComponentShowcase>

      <ComponentShowcase
        title="Spacing System"
        description="8px-based spacing scale for consistent layouts"
      >
        <Stack style={{ width: '100%', gap: 'var(--space-2)' }}>
          {spacingScale.map((space) => (
            <Row key={space.size} style={{ alignItems: 'center', gap: 'var(--space-4)' }}>
              <Text style={{ fontSize: 'var(--font-size-3)', fontFamily: 'var(--font-mono)', color: 'var(--color-11)', width: 48 }}>
                {space.class}
              </Text>
              <div
                style={{ backgroundColor: 'var(--blue4)', width: space.value, height: 32 }}
              />
              <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-10)' }}>{space.value}</Text>
            </Row>
          ))}
        </Stack>
      </ComponentShowcase>

      <ComponentShowcase
        title="Shadows"
        description="Elevation system using box shadows"
      >
        <Row style={{ width: '100%', flexWrap: 'wrap', gap: 'var(--space-6)' }}>
          {shadows.map((shadow, index) => (
            <Stack key={shadow.name} style={{ alignItems: 'center', flex: 1, minWidth: 140 }}>
              <div
                style={{
                  width: '100%',
                  height: 96,
                  backgroundColor: 'var(--color-background)',
                  borderRadius: 'var(--radius-4)',
                  boxShadow: index === 0 ? '0 1px 2px rgba(0,0,0,0.1)' : index === 1 ? '0 2px 4px rgba(0,0,0,0.1)' : index === 2 ? '0 4px 8px rgba(0,0,0,0.1)' : '0 8px 16px rgba(0,0,0,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 500, color: 'var(--color-12)' }}>
                  {shadow.name}
                </Text>
              </div>
              <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-11)', marginTop: 'var(--space-2)', fontFamily: 'var(--font-mono)' }}>
                {shadow.class}
              </Text>
            </Stack>
          ))}
        </Row>
      </ComponentShowcase>

      <ComponentShowcase
        title="Themes"
        description="Light, Dark, and Earth theme variations"
      >
        <Stack style={{ width: '100%', gap: 'var(--space-4)' }}>
          <Row style={{ flexWrap: 'wrap', gap: 'var(--space-4)' }}>
            <div style={{ flex: 1, minWidth: 180, backgroundColor: 'white', border: '1px solid var(--gray6)', borderRadius: 'var(--radius-4)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Sun color="#eab308" size={32} />
              <Text style={{ fontWeight: 600, color: 'var(--gray12)', marginTop: 'var(--space-2)' }}>Light Theme</Text>
              <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--gray11)', marginTop: 'var(--space-1)' }}>Clean and bright</Text>
            </div>
            <div style={{ flex: 1, minWidth: 180, backgroundColor: 'var(--gray12)', border: '1px solid var(--gray10)', borderRadius: 'var(--radius-4)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Sun color="#60a5fa" size={32} />
              <Text style={{ fontWeight: 600, color: 'white', marginTop: 'var(--space-2)' }}>Dark Theme</Text>
              <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--gray8)', marginTop: 'var(--space-1)' }}>Low-light optimized</Text>
            </div>
            <div style={{ flex: 1, minWidth: 180, backgroundColor: 'var(--orange2)', border: '1px solid var(--orange6)', borderRadius: 'var(--radius-4)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Sun color="#ea580c" size={32} />
              <Text style={{ fontWeight: 600, color: 'var(--orange12)', marginTop: 'var(--space-2)' }}>Earth Theme</Text>
              <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--orange11)', marginTop: 'var(--space-1)' }}>Warm and natural</Text>
            </div>
          </Row>
          <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-11)', textAlign: 'center' }}>
            Use the theme switcher in the top right to preview all themes
          </Text>
        </Stack>
      </ComponentShowcase>
    </Stack>
  );
}

import React from 'react';
import { Palette } from 'lucide-react';
import { Stack, Row, Text } from '@unicornlove/beyond-ui';

interface ColorSwatchProps {
  name: string;
  colorVar: string;
  weight: number;
}

function ColorSwatch({ name, colorVar, weight }: ColorSwatchProps) {
  const textColor = weight >= 600 ? 'var(--color-1)' : 'var(--color-12)';

  return (
    <Row style={{ alignItems: 'center', gap: '12px' }}>
      <Row
        style={{
          width: 80,
          height: 80,
          borderRadius: '8px',
          boxShadow: '0 2px 5px var(--color-shadow)',
          border: '1px solid var(--color-border)',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 500,
          fontSize: '14px',
          transition: 'transform 0.2s ease-in-out',
          backgroundColor: `rgb(var(${colorVar}))`,
          color: textColor,
        }}
      >
        {weight}
      </Row>
      <Stack style={{ flex: 1 }}>
        <Text style={{ fontSize: '14px', fontFamily: 'monospace', color: 'var(--color-11)' }}>
          {colorVar}
        </Text>
        <Text style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--color-10)', marginTop: '4px' }}>
          rgb(var({colorVar}))
        </Text>
      </Stack>
    </Row>
  );
}

interface ColorPaletteProps {
  name: string;
  displayName: string;
  baseColor: string;
}

function ColorPalette({ name, displayName, baseColor }: ColorPaletteProps) {
  const weights = [100, 200, 300, 400, 500, 600, 700, 800, 900];

  return (
    <Stack
      style={{
        backgroundColor: 'var(--color-background)',
        borderRadius: '12px',
        boxShadow: '0 5px 10px var(--color-shadow)',
        border: '1px solid var(--color-border)',
        padding: '24px',
      }}
    >
      <Row
        style={{
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <Row
          style={{
            width: 48,
            height: 48,
            borderRadius: '8px',
            boxShadow: '0 2px 5px var(--color-shadow)',
            backgroundColor: baseColor,
          }}
        />
        <Stack>
          <Text style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-11)' }}>
            {displayName}
          </Text>
          <Text style={{ fontSize: '14px', color: 'var(--color-10)', fontFamily: 'monospace' }}>
            {baseColor}
          </Text>
        </Stack>
      </Row>

      <Stack style={{ gap: '16px' }}>
        {weights.map((weight) => (
          <ColorSwatch
            key={weight}
            name={`${name}-${weight}`}
            colorVar={`--color-${name}-${weight}`}
            weight={weight}
          />
        ))}
      </Stack>
    </Stack>
  );
}

export default function Colors() {
  const colorPalettes = [
    { name: 'blue', displayName: 'Blue (Primary)', baseColor: '#0166FF' },
    { name: 'orange', displayName: 'Orange (Secondary)', baseColor: '#F0A000' },
    { name: 'yellow', displayName: 'Yellow (Tertiary)', baseColor: '#F2D200' },
    { name: 'gray', displayName: 'Gray (Neutral)', baseColor: '#5D6570' },
    { name: 'teal', displayName: 'Teal (Accent)', baseColor: '#008A94' },
  ];

  return (
    <Stack style={{ gap: '24px', padding: '16px' }}>
      <Stack
        style={{
          background: 'linear-gradient(to right, var(--color-blue-9), var(--color-teal-9))',
          borderRadius: '12px',
          padding: '32px',
          color: 'var(--color-1)',
          boxShadow: '0 10px 20px var(--color-shadow)',
        }}
      >
        <Row style={{ alignItems: 'center', gap: '16px' }}>
          <Row
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              padding: '16px',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Palette size={32} color="white" />
          </Row>
          <Stack>
            <Text style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--color-1)' }}>
              Color System
            </Text>
            <Text style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.9)', marginTop: '4px' }}>
              Complete 100-900 weight color scales for all brand colors
            </Text>
          </Stack>
        </Row>
      </Stack>

      <Stack
        style={{
          backgroundColor: 'var(--color-background)',
          borderRadius: '12px',
          boxShadow: '0 5px 10px var(--color-shadow)',
          border: '1px solid var(--color-border)',
          padding: '24px',
        }}
      >
        <Text style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-11)', marginBottom: '16px' }}>
          Color Scale Structure
        </Text>
        <Stack style={{ gap: '8px' }}>
          <Text style={{ fontSize: '14px', color: 'var(--color-10)' }}>
            <Text style={{ fontWeight: 600, color: 'var(--color-11)' }}>100:</Text> Lightest tint - near white with subtle color hint
          </Text>
          <Text style={{ fontSize: '14px', color: 'var(--color-10)' }}>
            <Text style={{ fontWeight: 600, color: 'var(--color-11)' }}>200-400:</Text> Light variations - ideal for backgrounds and subtle UI elements
          </Text>
          <Text style={{ fontSize: '14px', color: 'var(--color-10)' }}>
            <Text style={{ fontWeight: 600, color: 'var(--color-11)' }}>500:</Text> Base color - the primary brand color value
          </Text>
          <Text style={{ fontSize: '14px', color: 'var(--color-10)' }}>
            <Text style={{ fontWeight: 600, color: 'var(--color-11)' }}>600-800:</Text> Dark variations - ideal for text and emphasis
          </Text>
          <Text style={{ fontSize: '14px', color: 'var(--color-10)' }}>
            <Text style={{ fontWeight: 600, color: 'var(--color-11)' }}>900:</Text> Darkest shade - near black with subtle color tint
          </Text>
        </Stack>
      </Stack>

      <Row style={{ flexWrap: 'wrap', gap: '24px' }}>
        {colorPalettes.map((palette) => (
          <Stack key={palette.name} style={{ flex: 1, minWidth: 300 }}>
            <ColorPalette
              name={palette.name}
              displayName={palette.displayName}
              baseColor={palette.baseColor}
            />
          </Stack>
        ))}
      </Row>

      <Stack
        style={{
          backgroundColor: 'var(--color-background)',
          borderRadius: '12px',
          boxShadow: '0 5px 10px var(--color-shadow)',
          border: '1px solid var(--color-border)',
          padding: '24px',
        }}
      >
        <Text style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-11)', marginBottom: '16px' }}>
          Usage Examples
        </Text>
        <Stack style={{ gap: '16px' }}>
          <Stack>
            <Text style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-11)', marginBottom: '8px' }}>
              Theme tokens
            </Text>
            <Stack
              style={{
                backgroundColor: 'var(--color-background-secondary)',
                borderRadius: '8px',
                padding: '16px',
                fontFamily: 'monospace',
                fontSize: '14px',
                color: 'var(--color-10)',
                gap: '4px',
              }}
            >
              <Text>backgroundColor: '$blue9'</Text>
              <Text>color: '$orange11'</Text>
              <Text>borderColor: '$teal7'</Text>
            </Stack>
          </Stack>

          <Stack>
            <Text style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-11)', marginBottom: '8px' }}>
              CSS Variables
            </Text>
            <Stack
              style={{
                backgroundColor: 'var(--color-background-secondary)',
                borderRadius: '8px',
                padding: '16px',
                fontFamily: 'monospace',
                fontSize: '14px',
                color: 'var(--color-10)',
                gap: '4px',
              }}
            >
              <Text>color: rgb(var(--color-blue-500));</Text>
              <Text>background-color: rgb(var(--color-orange-100));</Text>
              <Text>border-color: rgb(var(--color-gray-300));</Text>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
}

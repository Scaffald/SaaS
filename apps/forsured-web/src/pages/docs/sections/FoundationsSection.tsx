import React from 'react';
import ComponentShowcase from '../../../components/DesignSystem/ComponentShowcase';
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
    <section className="space-y-8 mb-12">
      <div className="flex items-center space-x-3 mb-6">
        <Palette className="text-primary-500" size={32} />
        <h2 className="text-3xl font-display font-bold text-text-primary">
          Foundations
        </h2>
      </div>

      <ComponentShowcase
        title="Colors"
        description="Complete color palette with 100-900 weight scales for all brand colors"
      >
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {colorRamps.map((color) => (
            <div key={color.var} className="space-y-2">
              <div className="font-semibold text-text-primary mb-3 flex items-center space-x-2">
                <div
                  className="w-6 h-6 rounded shadow-sm"
                  style={{ backgroundColor: color.base }}
                />
                <span>{color.name}</span>
              </div>
              <div className="space-y-1">
                {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((weight) => (
                  <div key={weight} className="flex items-center space-x-2">
                    <div
                      className="w-16 h-8 rounded shadow-sm border border-border"
                      style={{
                        backgroundColor: `rgb(var(--color-${color.var}-${weight}))`,
                      }}
                    />
                    <span className="text-xs font-mono text-text-secondary">
                      {weight}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ComponentShowcase>

      <ComponentShowcase
        title="Typography"
        description="Font families, sizes, and weights used throughout the system"
      >
        <div className="w-full space-y-6">
          <div>
            <p className="text-sm font-semibold text-text-secondary mb-3">
              Display Font (Rokkitt)
            </p>
            <h1 className="font-display text-5xl font-bold text-text-primary">
              The quick brown fox
            </h1>
            <h2 className="font-display text-4xl font-bold text-text-primary mt-2">
              The quick brown fox
            </h2>
            <h3 className="font-display text-3xl font-bold text-text-primary mt-2">
              The quick brown fox
            </h3>
          </div>
          <div>
            <p className="text-sm font-semibold text-text-secondary mb-3">
              Body Font (Inter)
            </p>
            <p className="text-xl text-text-primary">
              The quick brown fox jumps over the lazy dog
            </p>
            <p className="text-base text-text-primary mt-2">
              The quick brown fox jumps over the lazy dog
            </p>
            <p className="text-sm text-text-primary mt-2">
              The quick brown fox jumps over the lazy dog
            </p>
            <p className="text-xs text-text-primary mt-2">
              The quick brown fox jumps over the lazy dog
            </p>
          </div>
        </div>
      </ComponentShowcase>

      <ComponentShowcase
        title="Spacing System"
        description="8px-based spacing scale for consistent layouts"
      >
        <div className="w-full space-y-2">
          {spacingScale.map((space) => (
            <div key={space.size} className="flex items-center space-x-4">
              <span className="text-sm font-mono text-text-secondary w-12">
                {space.class}
              </span>
              <div
                className="bg-primary-100 dark:bg-primary-900"
                style={{ width: space.value, height: '32px' }}
              />
              <span className="text-sm text-text-tertiary">{space.value}</span>
            </div>
          ))}
        </div>
      </ComponentShowcase>

      <ComponentShowcase
        title="Shadows"
        description="Elevation system using box shadows"
      >
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-6">
          {shadows.map((shadow) => (
            <div key={shadow.name} className="text-center">
              <div
                className={`w-full h-24 bg-surface rounded-lg ${shadow.class} flex items-center justify-center`}
              >
                <span className="text-sm font-medium text-text-primary">
                  {shadow.name}
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-2 font-mono">
                {shadow.class}
              </p>
            </div>
          ))}
        </div>
      </ComponentShowcase>

      <ComponentShowcase
        title="Themes"
        description="Light, Dark, and Earth theme variations"
      >
        <div className="w-full space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <Sun className="mx-auto mb-2 text-yellow-500" size={32} />
              <p className="font-semibold text-gray-900">Light Theme</p>
              <p className="text-xs text-gray-600 mt-1">Clean and bright</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
              <Sun className="mx-auto mb-2 text-blue-400" size={32} />
              <p className="font-semibold text-white">Dark Theme</p>
              <p className="text-xs text-gray-400 mt-1">Low-light optimized</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
              <Sun className="mx-auto mb-2 text-orange-600" size={32} />
              <p className="font-semibold text-orange-900">Earth Theme</p>
              <p className="text-xs text-orange-700 mt-1">Warm and natural</p>
            </div>
          </div>
          <p className="text-sm text-text-secondary text-center">
            Use the theme switcher in the top right to preview all themes
          </p>
        </div>
      </ComponentShowcase>
    </section>
  );
}

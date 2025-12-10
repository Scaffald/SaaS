// src/pages/docs/Tokens.tsx
import React from 'react';

function TokensDoc() {
  return (
    <div className="tokens-doc p-6">
      <h1 className="text-3xl font-bold mb-4">Design Tokens</h1>
      <p className="text-lg text-gray-700 mb-6">
        Our design tokens are the visual atoms of our design system. They represent the smallest, indivisible pieces of design information that are used to build our UI.
      </p>

      <h2 className="text-2xl font-semibold mb-3">Colors</h2>
      <p className="mb-4">
        We use a semantic color palette to ensure consistent meaning and usage across the application.
      </p>
      {/* Example of color display */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="p-4 border rounded shadow-sm">
          <div className="w-24 h-24 bg-primary-500 rounded mb-2"></div>
          <p className="font-medium">Primary 500</p>
          <p className="text-sm text-gray-600">#4F46E5</p>
        </div>
        <div className="p-4 border rounded shadow-sm">
          <div className="w-24 h-24 bg-green-500 rounded mb-2"></div>
          <p className="font-medium">Success 500</p>
          <p className="text-sm text-gray-600">#22C55E</p>
        </div>
      </div>

      <h2 className="text-2xl font-semibold mb-3">Typography</h2>
      <p className="mb-4">
        Our typography scale defines consistent font sizes, weights, and line heights.
      </p>
      {/* Example of typography display */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-2">Heading 1 (text-4xl font-bold)</h1>
        <h2 className="text-3xl font-semibold mb-2">Heading 2 (text-3xl font-semibold)</h2>
        <p className="text-base mb-2">Body (text-base)</p>
        <p className="text-sm text-gray-600">Small text (text-sm)</p>
      </div>

      <h2 className="text-2xl font-semibold mb-3">Spacing</h2>
      <p className="mb-4">
        Our spacing scale ensures consistent visual rhythm and hierarchy.
      </p>
      {/* Example of spacing display */}
      <div className="flex items-end mb-6">
        <div className="bg-blue-100 p-2 mr-2">Small (p-2)</div>
        <div className="bg-blue-100 p-4 mr-2">Medium (p-4)</div>
        <div className="bg-blue-100 p-8">Large (p-8)</div>
      </div>
    </div>
  );
}

export default TokensDoc;

// src/pages/docs/Components.tsx
import React from 'react';

interface ComponentDocProps {
  name: string;
  description: string;
  props: { name: string; type: string; description: string; default?: string }[];
  examples: { title: string; code: string; render: React.ReactNode }[];
}

function ComponentDocumentationTemplate({ name, description, props, examples }: ComponentDocProps) {
  return (
    <div className="component-doc p-6">
      <h1 className="text-3xl font-bold mb-4">{name}</h1>
      <p className="text-lg text-gray-700 mb-6">{description}</p>

      <h2 className="text-2xl font-semibold mb-3">Props</h2>
      <table className="min-w-full bg-white border border-gray-200 mb-6">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b text-left">Name</th>
            <th className="py-2 px-4 border-b text-left">Type</th>
            <th className="py-2 px-4 border-b text-left">Description</th>
            <th className="py-2 px-4 border-b text-left">Default</th>
          </tr>
        </thead>
        <tbody>
          {props.map((prop, index) => (
            <tr key={index}>
              <td className="py-2 px-4 border-b">{prop.name}</td>
              <td className="py-2 px-4 border-b">{prop.type}</td>
              <td className="py-2 px-4 border-b">{prop.description}</td>
              <td className="py-2 px-4 border-b">{prop.default || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-2xl font-semibold mb-3">Examples</h2>
      {examples.map((example, index) => (
        <div key={index} className="mb-6 border border-gray-200 rounded-lg p-4">
          <h3 className="text-xl font-medium mb-3">{example.title}</h3>
          <div className="bg-gray-50 p-3 rounded-md mb-3">
            <pre className="text-sm overflow-x-auto"><code>{example.code}</code></pre>
          </div>
          <div className="border border-gray-300 p-4 rounded-md">
            {example.render}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ComponentDocumentationTemplate;

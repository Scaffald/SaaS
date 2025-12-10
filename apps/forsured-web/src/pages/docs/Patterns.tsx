// src/pages/docs/Patterns.tsx
import React from 'react';

function PatternsDoc() {
  return (
    <div className="patterns-doc p-6">
      <h1 className="text-3xl font-bold mb-4">UI Patterns</h1>
      <p className="text-lg text-gray-700 mb-6">
        UI patterns are reusable solutions to common design problems. They provide a standardized way to build consistent and effective user interfaces.
      </p>

      <h2 className="text-2xl font-semibold mb-3">Form Validation</h2>
      <p className="mb-4">
        Ensure user input is correct and provide clear feedback.
      </p>
      {/* Example of form validation pattern */}
      <div className="border border-gray-300 rounded-lg p-4 mb-6">
        <label className="block text-sm font-medium text-gray-700">Email Address</label>
        <input type="email" className="mt-1 block w-full border-red-500 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500" />
        <p className="mt-2 text-sm text-red-600">Please enter a valid email address.</p>
      </div>

      <h2 className="text-2xl font-semibold mb-3">Empty States</h2>
      <p className="mb-4">
        Provide guidance and calls to action when there is no data to display.
      </p>
      {/* Example of empty state pattern */}
      <div className="border border-gray-300 rounded-lg p-4 mb-6 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v2m14 0h2m-2 0h-2M5 11v2a2 2 0 002 2h2m0 0a2 2 0 01-2-2v-2m7-10h-1.5a2.5 2.5 0 00-2.5 2.5V15a2.5 2.5 0 002.5 2.5H16a2.5 2.5 0 002.5-2.5V6a2.5 2.5 0 00-2.5-2.5z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No items</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new item.</p>
        <div className="mt-6">
          <button type="button" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Create New Item
          </button>
        </div>
      </div>
    </div>
  );
}

export default PatternsDoc;

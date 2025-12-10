// src/pages/docs/Changelog.tsx
import React from 'react';

function ChangelogDoc() {
  return (
    <div className="changelog-doc p-6">
      <h1 className="text-3xl font-bold mb-4">Changelog</h1>
      <p className="text-lg text-gray-700 mb-6">
        Keep track of all major changes and updates to the ForSured Design System.
      </p>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">Version 1.0.0 - November 28, 2025</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Initial release of the ForSured Design System.</li>
          <li>Introduced core components: Button, Input as TextInput, Modal.</li>
          <li>Defined foundational design tokens: Colors, Typography, Spacing.</li>
          <li>Established UI patterns for Form Validation and Empty States.</li>
        </ul>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">Version 0.9.0 - October 15, 2025</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Pre-release version with foundational styles and a limited component set.</li>
          <li>Internal testing and feedback integration.</li>
        </ul>
      </div>
    </div>
  );
}

export default ChangelogDoc;

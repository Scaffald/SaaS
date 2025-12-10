// src/pages/docs/Icons.tsx
import React from 'react';
import * as LucideIcons from 'lucide-react'; // Assuming Lucide is the icon library

function IconsDoc() {
  const icons = Object.keys(LucideIcons).filter(name => typeof (LucideIcons as any)[name] === 'function');

  return (
    <div className="icons-doc p-6">
      <h1 className="text-3xl font-bold mb-4">Icon Library</h1>
      <p className="text-lg text-gray-700 mb-6">
        We use the Lucide icon set for a consistent and modern look across our application.
      </p>

      <h2 className="text-2xl font-semibold mb-3">Available Icons ({icons.length})</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {icons.map((iconName) => {
          const IconComponent = (LucideIcons as any)[iconName];
          return (
            <div key={iconName} className="flex flex-col items-center justify-center p-4 border rounded-lg shadow-sm">
              <IconComponent size={32} className="mb-2" />
              <p className="text-sm text-center">{iconName}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default IconsDoc;

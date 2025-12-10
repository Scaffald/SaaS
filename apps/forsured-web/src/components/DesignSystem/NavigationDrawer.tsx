import React, { useState } from 'react';
import {
  X,
  ChevronDown,
  Menu,
  Home,
  Box,
  LayoutGrid,
  Layers,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ForsuredLogo from '../Common/ForsuredLogo';

export interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  children?: NavigationItem[];
}

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NavigationDrawer({
  isOpen,
  onClose,
}: NavigationDrawerProps) {
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'foundations',
    'components',
  ]);

  const navigationItems: NavigationItem[] = [
    {
      id: 'home',
      label: 'Design System Home',
      href: '/design-system',
      icon: Home,
    },
    {
      id: 'foundations',
      label: 'Foundations',
      icon: Layers,
      children: [
        { id: 'colors', label: 'Colors', href: '#colors' },
        { id: 'typography', label: 'Typography', href: '#typography' },
        { id: 'spacing', label: 'Spacing', href: '#spacing' },
        { id: 'shadows', label: 'Shadows', href: '#shadows' },
        { id: 'themes', label: 'Themes', href: '#themes' },
      ],
    },
    {
      id: 'components',
      label: 'Components',
      icon: Box,
      children: [
        { id: 'buttons', label: 'Buttons', href: '#buttons' },
        { id: 'forms', label: 'Form Controls', href: '#forms' },
        { id: 'display', label: 'Display', href: '#display' },
        { id: 'feedback', label: 'Feedback', href: '#feedback' },
        { id: 'navigation', label: 'Navigation', href: '#navigation' },
        { id: 'data-display', label: 'Data Display', href: '#data-display' },
        { id: 'layout', label: 'Layout', href: '#layout' },
      ],
    },
    {
      id: 'patterns',
      label: 'Patterns',
      icon: LayoutGrid,
      children: [
        {
          id: 'forms-patterns',
          label: 'Form Patterns',
          href: '#form-patterns',
        },
        {
          id: 'layout-patterns',
          label: 'Layout Patterns',
          href: '#layout-patterns',
        },
        {
          id: 'feedback-patterns',
          label: 'Feedback Patterns',
          href: '#feedback-patterns',
        },
      ],
    },
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleNavigate = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.getElementById(href.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        onClose();
      }
    } else {
      navigate(href);
      onClose();
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen w-72 bg-surface border-r border-border z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } lg:fixed overflow-y-auto`}
      >
        <div className="p-6 border-b border-border flex items-center justify-between">
          <ForsuredLogo className="h-6" />
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-bg-secondary rounded-lg transition-colors"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        <nav className="p-4">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isExpanded = expandedSections.includes(item.id);
              const hasChildren = item.children && item.children.length > 0;

              return (
                <div key={item.id}>
                  {hasChildren ? (
                    <>
                      <button
                        onClick={() => toggleSection(item.id)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-bg-secondary transition-colors text-text-primary"
                      >
                        <div className="flex items-center space-x-2">
                          {Icon && <Icon size={18} />}
                          <span className="font-medium">{item.label}</span>
                        </div>
                        <ChevronDown
                          size={16}
                          className={`transform transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isExpanded && (
                        <div className="ml-4 mt-1 space-y-1">
                          {item.children.map((child) => (
                            <button
                              key={child.id}
                              onClick={() =>
                                child.href && handleNavigate(child.href)
                              }
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-bg-secondary transition-colors text-text-secondary hover:text-text-primary text-sm"
                            >
                              {child.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => item.href && handleNavigate(item.href)}
                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-bg-secondary transition-colors text-text-primary"
                    >
                      {Icon && <Icon size={18} />}
                      <span className="font-medium">{item.label}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

        </nav>
      </aside>
    </>
  );
}

export function DrawerToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden fixed top-4 left-4 z-30 p-2 bg-surface border border-border rounded-lg shadow-lg hover:bg-surface-hover transition-colors"
      aria-label="Toggle navigation"
    >
      <Menu size={24} className="text-text-primary" />
    </button>
  );
}

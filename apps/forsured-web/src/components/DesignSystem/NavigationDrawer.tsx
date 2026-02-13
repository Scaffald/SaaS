import React, { useState } from 'react';
import { Stack, Row, Text } from '@scaffald/ui';
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
  icon?: React.ComponentType<{ size?: number }>;
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
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 40,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
          className="lg:hidden"
        />
      )}

      <aside
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100vh',
          width: 288,
          backgroundColor: 'var(--color-background)',
          borderRight: '1px solid var(--color-border)',
          zIndex: 50,
          overflow: 'auto',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 300ms ease-in-out',
        }}
        className="lg:fixed lg:transform-none"
      >
        <Row style={{ padding: 'var(--space-6)', borderBottom: '1px solid var(--color-border)', alignItems: 'center', justifyContent: 'space-between' }}>
          <ForsuredLogo height={24} />
          <button
            onClick={onClose}
            style={{
              padding: 'var(--space-2)',
              borderRadius: 'var(--radius-4)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
            className="lg:hidden hover:bg-[var(--color-background-secondary)]"
          >
            <X size={20} color="var(--color-11)" />
          </button>
        </Row>

        <nav style={{ padding: 'var(--space-4)' }}>
          <Stack style={{ gap: 'var(--space-1)' }}>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isExpanded = expandedSections.includes(item.id);
              const hasChildren = item.children && item.children.length > 0;

              return (
                <Stack key={item.id}>
                  {hasChildren ? (
                    <>
                      <button
                        onClick={() => toggleSection(item.id)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: 'var(--space-2) var(--space-3)',
                          borderRadius: 'var(--radius-4)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                        className="hover:bg-[var(--color-background-secondary)]"
                      >
                        <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                          {Icon && <Icon size={18} />}
                          <Text style={{ fontWeight: 500, color: 'var(--color-12)' }}>{item.label}</Text>
                        </Row>
                        <div
                          style={{
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 200ms',
                          }}
                        >
                          <ChevronDown size={16} />
                        </div>
                      </button>
                      {isExpanded && (
                        <Stack style={{ marginLeft: 'var(--space-4)', marginTop: 'var(--space-1)', gap: 'var(--space-1)' }}>
                          {item.children.map((child) => (
                            <button
                              key={child.id}
                              onClick={() =>
                                child.href && handleNavigate(child.href)
                              }
                              style={{
                                width: '100%',
                                padding: 'var(--space-2) var(--space-3)',
                                borderRadius: 'var(--radius-4)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                textAlign: 'left',
                              }}
                              className="hover:bg-[var(--color-background-secondary)]"
                            >
                              <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-11)' }}>
                                {child.label}
                              </Text>
                            </button>
                          ))}
                        </Stack>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => item.href && handleNavigate(item.href)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        padding: 'var(--space-2) var(--space-3)',
                        borderRadius: 'var(--radius-4)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      className="hover:bg-[var(--color-background-secondary)]"
                    >
                      {Icon && <Icon size={18} />}
                      <Text style={{ fontWeight: 500, color: 'var(--color-12)' }}>{item.label}</Text>
                    </button>
                  )}
                </Stack>
              );
            })}
          </Stack>
        </nav>
      </aside>
    </>
  );
}

export function DrawerToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Toggle navigation"
      style={{
        position: 'absolute',
        top: 'var(--space-4)',
        left: 'var(--space-4)',
        zIndex: 30,
        padding: 'var(--space-2)',
        backgroundColor: 'var(--color-background)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-4)',
        boxShadow: '0 2px 8px var(--color-shadow)',
        cursor: 'pointer',
      }}
      className="lg:hidden hover:bg-[var(--color-background-hover)]"
    >
      <Menu size={24} color="var(--color-12)" />
    </button>
  );
}

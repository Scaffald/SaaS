import React, { useState } from 'react';
import { Stack, Row, Box, Text } from '@unicornlove/beyond-ui';
import {
  X,
  ChevronDown,
  Menu,
  Home,
  Box as BoxIcon,
  LayoutGrid,
  Layers,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ForsuredLogo from '../../components/Common/ForsuredLogo';

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
      icon: BoxIcon,
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
        <Box
          onClick={onClose}
          className="lg:hidden"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 40,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        />
      )}

      <Box
        as="aside"
        className="lg:transform-none"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: 288,
          backgroundColor: 'var(--color-background)',
          borderRight: '1px solid var(--color-border)',
          zIndex: 50,
          overflowY: 'auto',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 300ms ease-in-out',
        }}
      >
        <Row style={{ padding: 'var(--space-6)', borderBottom: '1px solid var(--color-border)', alignItems: 'center', justifyContent: 'space-between' }}>
          <ForsuredLogo height={24} />
          <Box
            as="button"
            onClick={onClose}
            className="lg:hidden"
            style={{
              padding: 'var(--space-2)',
              borderRadius: 'var(--radius-4)',
              cursor: 'pointer',
              backgroundColor: 'transparent',
              border: 'none',
            }}
          >
            <X size={20} color="var(--color-11)" />
          </Box>
        </Row>

        <Box as="nav" style={{ padding: 'var(--space-4)' }}>
          <Stack style={{ gap: 'var(--space-1)' }}>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isExpanded = expandedSections.includes(item.id);
              const hasChildren = item.children && item.children.length > 0;

              return (
                <Stack key={item.id}>
                  {hasChildren ? (
                    <>
                      <Row
                        as="button"
                        onClick={() => toggleSection(item.id)}
                        style={{
                          width: '100%',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingLeft: 'var(--space-3)',
                          paddingRight: 'var(--space-3)',
                          paddingTop: 'var(--space-2)',
                          paddingBottom: 'var(--space-2)',
                          borderRadius: 'var(--radius-4)',
                          cursor: 'pointer',
                          backgroundColor: 'transparent',
                          border: 'none',
                        }}
                      >
                        <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                          {Icon && <Icon size={18} />}
                          <Text style={{ fontWeight: 500, color: 'var(--color-12)' }}>{item.label}</Text>
                        </Row>
                        <Box
                          style={{
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 200ms',
                          }}
                        >
                          <ChevronDown size={16} />
                        </Box>
                      </Row>
                      {isExpanded && (
                        <Stack style={{ marginLeft: 'var(--space-4)', marginTop: 'var(--space-1)', gap: 'var(--space-1)' }}>
                          {item.children.map((child) => (
                            <Box
                              key={child.id}
                              as="button"
                              onClick={() =>
                                child.href && handleNavigate(child.href)
                              }
                              style={{
                                width: '100%',
                                paddingLeft: 'var(--space-3)',
                                paddingRight: 'var(--space-3)',
                                paddingTop: 'var(--space-2)',
                                paddingBottom: 'var(--space-2)',
                                borderRadius: 'var(--radius-4)',
                                cursor: 'pointer',
                                backgroundColor: 'transparent',
                                border: 'none',
                                textAlign: 'left',
                              }}
                            >
                              <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-11)' }}>
                                {child.label}
                              </Text>
                            </Box>
                          ))}
                        </Stack>
                      )}
                    </>
                  ) : (
                    <Row
                      as="button"
                      onClick={() => item.href && handleNavigate(item.href)}
                      style={{
                        width: '100%',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        paddingLeft: 'var(--space-3)',
                        paddingRight: 'var(--space-3)',
                        paddingTop: 'var(--space-2)',
                        paddingBottom: 'var(--space-2)',
                        borderRadius: 'var(--radius-4)',
                        cursor: 'pointer',
                        backgroundColor: 'transparent',
                        border: 'none',
                      }}
                    >
                      {Icon && <Icon size={18} />}
                      <Text style={{ fontWeight: 500, color: 'var(--color-12)' }}>{item.label}</Text>
                    </Row>
                  )}
                </Stack>
              );
            })}
          </Stack>
        </Box>
      </Box>
    </>
  );
}

export function DrawerToggle({ onClick }: { onClick: () => void }) {
  return (
    <Box
      as="button"
      onClick={onClick}
      className="lg:hidden"
      style={{
        position: 'fixed',
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
      aria-label="Toggle navigation"
    >
      <Menu size={24} color="var(--color-12)" />
    </Box>
  );
}

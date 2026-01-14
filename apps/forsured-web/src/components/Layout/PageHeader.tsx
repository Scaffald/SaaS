/**
 * PageHeader - Reusable wrapper component using SaaSSectionHeader
 * Integrates with lexicon system for dynamic labels
 */

import { SaaSSectionHeader } from '@unicornlove/beyond-ui';
import type { SaaSSectionHeaderProps, IconComponent } from '@unicornlove/beyond-ui';
import { useLexicon } from '../../contexts/LexiconContext';

export interface PageHeaderProps extends Omit<SaaSSectionHeaderProps, 'title'> {
  /**
   * Page title key for lexicon (e.g., 'nav.dashboard')
   * If not provided, uses title prop directly
   */
  titleKey?: string;
  
  /**
   * Page title (used if titleKey is not provided)
   */
  title?: string;
  
  /**
   * Description key for lexicon
   */
  descriptionKey?: string;
  
  /**
   * Description (used if descriptionKey is not provided)
   */
  description?: string;
}

export default function PageHeader({
  titleKey,
  title: titleProp,
  descriptionKey,
  description: descriptionProp,
  ...rest
}: PageHeaderProps) {
  const { t } = useLexicon();
  
  // Get title from lexicon if key provided, otherwise use prop
  const title = titleKey ? t(titleKey) : (titleProp || '');
  
  // Get description from lexicon if key provided, otherwise use prop
  const description = descriptionKey ? t(descriptionKey) : descriptionProp;
  
  return (
    <SaaSSectionHeader
      title={title}
      description={description}
      {...rest}
    />
  );
}

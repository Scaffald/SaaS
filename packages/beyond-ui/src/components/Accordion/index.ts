/**
 * Accordion compound component exports
 */

import { Accordion as AccordionRoot } from './Accordion'
import { AccordionItem } from './AccordionItem'
import { AccordionTrigger } from './AccordionTrigger'
import { AccordionContent } from './AccordionContent'

export const Accordion = Object.assign(AccordionRoot, {
  Item: AccordionItem,
  Trigger: AccordionTrigger,
  Content: AccordionContent,
})

export type {
  AccordionProps,
  AccordionItemProps,
  AccordionTriggerProps,
  AccordionContentProps,
  AccordionMode,
  AccordionWidth,
  AccordionValue,
} from './Accordion.types'

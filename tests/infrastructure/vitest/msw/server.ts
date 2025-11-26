
import { setupServer } from 'msw/node';
import { createMapboxHandler } from './mapbox';
import { createOpenAIHandler } from './openai';
import { createSendgridHandler } from './sendgrid';
import { createStripeHandler } from './stripe';

export const server = setupServer(
  createMapboxHandler(),
  createOpenAIHandler(),
  createSendgridHandler(),
  createStripeHandler(),
);

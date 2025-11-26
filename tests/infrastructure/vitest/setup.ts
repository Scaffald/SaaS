import { JSDOM } from 'jsdom';
import '@testing-library/jest-dom';

const dom = new JSDOM();
global.document = dom.window.document;
global.window = dom.window;

// Define __DEV__ as a global variable
global.__DEV__ = true;
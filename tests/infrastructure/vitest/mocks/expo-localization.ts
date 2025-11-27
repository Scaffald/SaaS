// Mock for expo-localization
// Provides locale detection and localization utilities

export const getLocales = () => [
  {
    languageCode: 'en',
    countryCode: 'US',
    languageTag: 'en-US',
    textDirection: 'ltr',
  },
];

export const getCalendars = () => ['gregorian'];

export const uses24HourClock = () => false;

export const usesMetricSystem = () => false;

export const getTemperatureUnit = () => 'fahrenheit' as const;

export const getCurrencies = () => ['USD'];

export const getNumberFormatSettings = () => ({
  decimalSeparator: '.',
  groupingSeparator: ',',
});

export const getDecimalSeparator = () => '.';

export const getGroupingSeparator = () => ',';

export const getNativeConstants = () => ({
  locales: getLocales(),
  timeZone: 'UTC',
  uses24HourClock: false,
  usesMetricSystem: false,
  temperatureUnit: 'fahrenheit',
  currencies: getCurrencies(),
});

export default {
  getLocales,
  getCalendars,
  uses24HourClock,
  usesMetricSystem,
  getTemperatureUnit,
  getCurrencies,
  getNumberFormatSettings,
  getDecimalSeparator,
  getGroupingSeparator,
  getNativeConstants,
};

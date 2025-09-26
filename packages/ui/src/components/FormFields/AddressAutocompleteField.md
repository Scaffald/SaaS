# Address Autocomplete Component

A reusable address autocomplete component that uses Mapbox's Geocoding API to provide real-time address suggestions as users type.

## Features

- **Mapbox Integration**: Uses Mapbox's powerful Geocoding API
- **Flexible Styling**: Default, compact, and expanded variants
- **Form Integration**: Works with `@ts-react/form` and your existing form system
- **Performance Optimized**: Debounced API calls and request cancellation
- **Error Handling**: Comprehensive error handling and fallbacks
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Setup

### 1. Environment Setup

The component automatically uses your Mapbox access token from environment variables. Make sure you have the following in your `.env` file:

```bash
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1Ijoic2NhZmZhbGQiLCJhIjoiY204Nmh5NWZ5MDRycTJrcHo0NHc1em5vZCJ9.w8FJ5p2msraGyyOeeLanhg
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1Ijoic2NhZmZhbGQiLCJhIjoiY204Nmh5NWZ5MDRycTJrcHo0NHc1em5vZCJ9.w8FJ5p2msraGyyOeeLanhg
```

### 2. Basic Usage

```tsx
import { AddressAutocompleteInput } from '@app/ui'

function MyComponent() {
  const [address, setAddress] = useState('')
  
  return (
    <AddressAutocompleteInput
      value={address}
      onChangeText={setAddress}
      placeholder="Enter your address..."
      label="Address"
      // accessToken is automatically loaded from environment variables
    />
  )
}
```

### 3. With Form Integration

```tsx
import { AddressAutocompleteField, AddressAutocompleteSchema } from '@app/ui'
import { createTsForm } from '@ts-react/form'
import { z } from 'zod'

const schema = z.object({
  address: AddressAutocompleteSchema
})

const form = createTsForm(schema)

function MyForm() {
  return (
    <form.Form onSubmit={handleSubmit}>
      <form.Field name="address" component={AddressAutocompleteField} />
    </form.Form>
  )
}
```

## Configuration

### Autocomplete Options

```tsx
<AddressAutocompleteInput
  autocompleteOptions={{
    // accessToken is automatically loaded from environment variables
    geocodingOptions: {
      country: 'US',           // Limit to specific country
      types: ['address'],      // Limit to address types
      limit: 5,               // Maximum number of results
      language: 'en'          // Response language
    },
    debounceMs: 300,          // Debounce delay
    minQueryLength: 2,        // Minimum characters to trigger search
    onError: (error) => {     // Error handler
      console.error(error)
    }
  }}
/>
```

### Variants

#### Compact
```tsx
<AddressAutocompleteInput
  variant="compact"
  size="$3"
/>
```

#### Expanded
```tsx
<AddressAutocompleteInput
  variant="expanded"
  size="$5"
  showFullAddress={true}
/>
```

## Props

### AddressAutocompleteInput

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | `''` | Current input value |
| `onChangeText` | `(value: string) => void` | - | Called when input value changes |
| `onAddressSelect` | `(suggestion: AddressSuggestion) => void` | - | Called when address is selected |
| `variant` | `'default' \| 'compact' \| 'expanded'` | `'default'` | Visual variant |
| `showFullAddress` | `boolean` | `false` | Show full address in suggestions |
| `maxSuggestions` | `number` | `5` | Maximum number of suggestions |
| `autocompleteOptions` | `UseAddressAutocompleteOptions` | `{}` | Autocomplete configuration |

### UseAddressAutocompleteOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `accessToken` | `string` | - | **Required** Mapbox access token |
| `geocodingOptions` | `MapboxGeocodingOptions` | `{}` | Mapbox geocoding parameters |
| `debounceMs` | `number` | `300` | Debounce delay in milliseconds |
| `minQueryLength` | `number` | `2` | Minimum query length to trigger search |
| `onSelect` | `(suggestion: AddressSuggestion) => void` | - | Called when suggestion is selected |
| `onError` | `(error: Error) => void` | - | Called when error occurs |

### MapboxGeocodingOptions

| Option | Type | Description |
|--------|------|-------------|
| `country` | `string` | Limit results to specific country (e.g., 'US') |
| `types` | `string[]` | Limit to specific place types (e.g., ['address']) |
| `bbox` | `[number, number, number, number]` | Bounding box [minLon, minLat, maxLon, maxLat] |
| `limit` | `number` | Maximum number of results (1-10) |
| `language` | `string` | Response language (e.g., 'en') |

## AddressSuggestion Interface

```tsx
interface AddressSuggestion {
  id: string
  displayName: string
  fullAddress: string
  street?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  coordinates?: {
    latitude: number
    longitude: number
  }
  rawData?: any // Mapbox-specific data
}
```

## Styling

The component follows your existing Tamagui patterns and supports all standard Input props:

```tsx
<AddressAutocompleteInput
  size="$4"
  borderColor="$blue8"
  focusStyle={{
    borderColor: '$blue10',
    borderWidth: 2
  }}
  backgroundColor="$color2"
/>
```

## Error Handling

The component includes comprehensive error handling:

- Missing access token
- Invalid access token
- Network request failures
- Rate limiting
- Invalid responses

Errors are displayed below the input field and can be customized through the `onError` callback.

## Performance Considerations

- **Debouncing**: API calls are debounced to prevent excessive requests (300ms default)
- **Request Cancellation**: Previous requests are cancelled when new ones are made
- **Rate Limiting**: Be aware of Mapbox's rate limits for your access token
- **Caching**: Consider implementing client-side caching for frequently searched addresses

## Accessibility

- Proper ARIA labels
- Keyboard navigation support
- Screen reader friendly
- Focus management

## Cost Considerations

Mapbox's Geocoding API has the following pricing (as of 2024):
- Free tier: 100,000 requests/month
- Paid plans start at $0.50 per 1,000 requests after free tier

For development, the free tier should be sufficient for testing and small applications.

## Examples

See the Storybook stories for comprehensive examples of all features and variants.

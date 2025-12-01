# Contributing to @unicornlove/ui

Thank you for your interest in contributing to @unicornlove/ui!

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Build the package:
   ```bash
   pnpm --filter @unicornlove/ui build
   ```
4. Run tests:
   ```bash
   pnpm --filter @unicornlove/ui test:unit
   ```

## Development Workflow

1. Create a feature branch from `main`
2. Make your changes
3. Run linting and type checking:
   ```bash
   pnpm check
   ```
4. Run tests:
   ```bash
   pnpm test:all
   ```
5. Commit your changes with descriptive messages
6. Push and create a pull request

## Code Style

- Follow the existing code style
- Use TypeScript for all new code
- Prefer named exports over default exports
- Use Tamagui shorthand properties (see project rules)
- Write tests for new components

## Testing

- Write unit tests for all new components
- Maintain 80%+ code coverage
- Test on iOS, Android, and web when applicable

## Building

The package uses `tsup` for building. Build outputs are in the `dist/` directory:

- ESM: `dist/index.mjs`
- CJS: `dist/index.js`
- Types: `dist/index.d.ts`

## Questions?

Feel free to open an issue for questions or discussions.


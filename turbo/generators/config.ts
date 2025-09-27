import type { PlopTypes } from '@turbo/gen'

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setGenerator('component', {
    description: 'Generates a component, story and sets up exports',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'What is the name of the new component to create?',
        validate: (input: string) => {
          if (input.includes('.')) {
            return 'name cannot include an extension'
          }
          if (input.includes(' ')) {
            return 'name cannot include spaces'
          }
          if (!input) {
            return 'name is required'
          }
          return true
        },
      },
      {
        type: 'confirm',
        name: 'createStory',
        message: 'Do you want a story file to be created?',
      },
      {
        type: 'confirm',
        name: 'createNativeFile',
        message: 'Do you want a .native.tsx file to be created?',
      },
    ],
    actions: (_prompts) => {
      const actions: PlopTypes.ActionType[] = [
        {
          type: 'add',
          path: '{{ turbo.paths.root }}/packages/ui/src/components/{{ pascalCase name }}.tsx',
          templateFile: 'templates/component.hbs',
        },
        {
          type: 'modify', // use 'modify' instead of 'append' cause we want to handle the newline at the end of file properly
          path: '{{ turbo.paths.root }}/packages/ui/src/components/index.ts',
          pattern: /(\n\n*)$/g, // removes newline at the end of the file
          template: "\nexport * from './{{ pascalCase name }}'\n", // newline before and after
        },
      ]
      if (_prompts?.createStory) {
        actions.push({
          type: 'add',
          path: '{{ turbo.paths.root }}/packages/ui/src/components/{{ pascalCase name }}.stories.tsx',
          templateFile: 'templates/story.hbs',
        })
      }
      if (_prompts?.createNativeFile) {
        actions.push({
          type: 'add',
          path: '{{ turbo.paths.root }}/packages/ui/src/components/{{ pascalCase name }}.native.tsx',
          templateFile: 'templates/component-native.hbs',
        })
      }
      return actions
    },
  })
  plop.setGenerator('screen', {
    description: 'Generates a feature directory, a screen and Next.js and Expo routes',
    prompts: async (inquirer) => {
      const { path } = await inquirer.prompt({
        type: 'input',
        name: 'path',
        message: "What's the path for this screen? (e.g. /settings/two-factor-auth)",
        validate: (input: string) => {
          if (!input.startsWith('/')) {
            return 'path should start with /'
          }
          if (input.includes(' ')) {
            return 'path cannot include spaces'
          }
          if (!input) {
            return 'path is required'
          }
          return true
        },
      })
      const { featureName } = await inquirer.prompt({
        default: path.split('/')[1],
        type: 'input',
        name: 'featureName',
        message:
          'What feature does this screen belong to? This could be existing or new. e.g. auth, feed, chat)',
        validate: (input: string) => {
          if (input.includes(' ')) {
            return 'feature name cannot include spaces'
          }
          if (!input) {
            return 'feature name is required'
          }
          return true
        },
      })
      const { screenName } = await inquirer.prompt({
        default: path.split('/').pop(),
        type: 'input',
        name: 'screenName',
        message: "What's the name of this screen? (e.g. index, create, list)",
        validate: (input: string) => {
          if (input.includes(' ')) {
            return 'feature name cannot include spaces'
          }
          if (!input) {
            return 'feature name is required'
          }
          return true
        },
      })
      return {
        featureName,
        path,
        screenName,
      }
    },
    actions: (_prompts) => {
      const actions: PlopTypes.ActionType[] = [
        {
          type: 'add',
          path: '{{ turbo.paths.root }}/packages/core/features/{{ dashCase featureName }}/{{ dashCase screenName }}-screen.tsx',
          templateFile: 'templates/screen.hbs',
        },
        {
          type: 'add',
          path: '{{ turbo.paths.root }}/apps/next/pages{{ path }}/index.tsx',
          templateFile: 'templates/nextjs-page.hbs',
        },
        {
          type: 'add',
          path: '{{ turbo.paths.root }}/apps/expo/app{{ path }}/index.tsx',
          templateFile: 'templates/expo-page.hbs',
        },
      ]
      return actions
    },
  })
  plop.setGenerator('router', {
    description: 'Generates a tRPC router and registers it',
    prompts: async (inquirer) => {
      const { name } = await inquirer.prompt({
        type: 'input',
        name: 'name',
        message: "What's the name of the new router to create? (e.g. user, post, comment)",
        validate: (input: string) => {
          if (!input) {
            return 'name is required'
          }
          return true
        },
      })

      return {
        name,
      }
    },
    actions: (_prompts) => {
      const actions: PlopTypes.ActionType[] = [
        {
          type: 'add',
          path: '{{ turbo.paths.root }}/packages/api/src/routers/{{ camelCase name }}.ts',
          templateFile: 'templates/trpc-router.hbs',
        },
        {
          type: 'append',
          path: '{{ turbo.paths.root }}/packages/api/src/routers/_app.ts',
          pattern: "import { createTRPCRouter } from '../trpc'",
          template: "import { {{ camelCase name }}Router } from './{{ camelCase name }}'",
        },
        {
          type: 'append',
          path: '{{ turbo.paths.root }}/packages/api/src/routers/_app.ts',
          pattern: 'createTRPCRouter({',
          template: '  {{ camelCase name }}: {{ camelCase name }}Router,',
        },
      ]
      return actions
    },
  })
  plop.setGenerator('route', {
    description:
      'Generates a dashboard route with left/right/screen components following naming convention',
    prompts: async (inquirer) => {
      const { routePath } = await inquirer.prompt({
        type: 'input',
        name: 'routePath',
        message: "What's the route path? (e.g. profile/overview, settings/general)",
        validate: (input: string) => {
          if (input.includes(' ')) {
            return 'route path cannot include spaces'
          }
          if (!input) {
            return 'route path is required'
          }
          if (!input.includes('/')) {
            return 'route path must include parent/child (e.g. profile/overview)'
          }
          return true
        },
      })

      const [parentName, childName] = routePath.split('/')

      return {
        parentName,
        childName,
        routePath,
      }
    },
    actions: (_prompts) => {
      const actions: PlopTypes.ActionType[] = [
        // Create left component
        {
          type: 'add',
          path: '{{ turbo.paths.root }}/packages/core/features/{{ dashCase parentName }}/{{ dashCase parentName }}-{{ dashCase childName }}-left.tsx',
          templateFile: 'templates/route-left.hbs',
        },
        // Create right component
        {
          type: 'add',
          path: '{{ turbo.paths.root }}/packages/core/features/{{ dashCase parentName }}/{{ dashCase parentName }}-{{ dashCase childName }}-right.tsx',
          templateFile: 'templates/route-right.hbs',
        },
        // Create screen component
        {
          type: 'add',
          path: '{{ turbo.paths.root }}/packages/core/features/{{ dashCase parentName }}/{{ dashCase parentName }}-{{ dashCase childName }}-screen.tsx',
          templateFile: 'templates/route-screen.hbs',
        },
        // Create Next.js page
        {
          type: 'add',
          path: '{{ turbo.paths.root }}/apps/next/pages/dashboard/{{ routePath }}/index.tsx',
          templateFile: 'templates/route-nextjs-page.hbs',
        },
        // Create Expo page
        {
          type: 'add',
          path: '{{ turbo.paths.root }}/apps/expo/app/dashboard/{{ routePath }}/index.tsx',
          templateFile: 'templates/route-expo-page.hbs',
        },
      ]
      return actions
    },
  })
}

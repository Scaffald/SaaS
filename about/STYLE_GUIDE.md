# Coding Guide in Typescript

## Naming

This list enumerates how to declare variables, classes and so in a unified way.

- **Files**: kebab-case (e.g. `items-table.ts`).
- **Folders**: kebab-case (e.g. `/items-table`).
- **Variables and Const**: camelCase (e.g. `const apiConfig`).
- **Magic Const**: SNAKE_CASE uppercase (e.g. `const GOLDEN_RATIO = 1.618`).
- **Classes and React Components**: PascalCase (e.g. `export const ActionsForm = () => {}`)
- **Interfaces**: PascalCase (e.g. `interface Item {}`).
  - add `-Props` as suffix when it refers to React Component props (e.g. `interface ItemTableProps {}`)
- **Types**: PascalCase (e.g. `type RewardCapsId`).
- **Models**: PascalCase (e,.g. `class Action extends Model<IAction> {}`).
- **Model properties**: camelCase
  ```
  class Action extends Model<IAction> {
    declare id: CreationOptional<string>;
    declare name: string;
    declare longDesc: string;
    declare shortDesc: string;
    /**/
  }
  ```

❗**Golden naming rule**: ask a colleague for advice.

## Other recommendations

- **Code in English**.
- Add **preffixes for reserved words** like `type` instead of using any other language.
- Models and their interfaces must use both camelCase for properties.
- Use `type` or `enum` to provide contextual information.
- Use `type` when it refers to union types (for specific primitive types such as strings or numbers).
  - E.g. `type RewardCapsIds = 'days' | 'months' | 'weeks' | 'years'`
- Avoid using magic numbers when you can use a `type`, `interface` or `enum`.
- Prefer object literals instead of `enum` (when possible).
- For entity-referred React Components, use entity name as preffix.
- Use `!variable` for false assertions.
- Never, ever compare against `true` or `false`.
  - I.e. ~~`something === false`~~ or ~~`somethingElse === true`~~
- Never compare `> 0` for length inside an `if`. Use only length.
  - E.g. `if (something.length)  doStuff()`;
- Never use `await` after a `return`.
  - I.e. ~~`return await myPromise()`~~
- Avoid use of `for` loops when you can use `map`, `forEach`, `filter`, `reduce`, etc.
- Avoid using initials/acronyms where they are not fully undertood. E.g. ~~`const vcte = 3;`~~
  - `i`, `j`, `k` inside a `for` loop are **tolerated**.
  - `auxIndex` is **not** recommended.
- Use plural names for arrays and singular names for items inside those arrays.
- Prefer **iterativity over recursivity**.
- Prefer **synchrony over asynchrony** and **asynchrony over cron jobs**.

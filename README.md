# unicode-collation-algorithm2

Forked from [unicode-collation-algorithm](https://github.com/pmurias/unicode-collation-algorithm).

Changes made to original source:

- Implemented in TypeScript.
- Bumped dependency modules.
- Changed tests from jest to mocha & chai & ts-node.
- Various other small changes.

JavaScript (TypeScript) implementation of UCA (Unicode collation algorithm) module.

## Usage

### Using with preinitialization

```ts
import * as uca from "unicode-collation-algorithm2";
await uca.init();
uca.compare("a", "a"); // 0
uca.compare("a", "b"); // -1
uca.compare("b", "a"); // 1
uca.compare("y", "Y"); // 0
uca.compare("Ý", "Y"); // 0
```

### Using with autoinitializion as necessary

```ts
import * as uca from "unicode-collation-algorithm2";
await uca.compareAndAutoInit("a", "a"); // 0
await uca.compareAndAutoInit("a", "b"); // -1
await uca.compareAndAutoInit("b", "a"); // 1
await uca.compareAndAutoInit("y", "Y"); // 0
await uca.compareAndAutoInit("Ý", "Y"); // 0
```

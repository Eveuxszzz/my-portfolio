# Graph Report - my-portfolio  (2026-11-17)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 93 nodes · 123 edges · 20 communities (7 shown, 13 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `77c22dbb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 23 edges
2. `App()` - 7 edges
3. `react-router-dom` - 5 edges
4. `scripts` - 5 edges
5. `react` - 4 edges
6. `Header()` - 3 edges
7. `About()` - 3 edges
8. `Contact()` - 3 edges
9. `Home()` - 3 edges
10. `Projects()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `Header()`  [EXTRACTED]
  src/App.tsx → src/components/Header.tsx
- `App()` --calls--> `About()`  [EXTRACTED]
  src/App.tsx → src/pages/About.tsx
- `App()` --calls--> `Contact()`  [EXTRACTED]
  src/App.tsx → src/pages/Contact.tsx
- `App()` --calls--> `Home()`  [EXTRACTED]
  src/App.tsx → src/pages/Home.tsx
- `App()` --calls--> `Projects()`  [EXTRACTED]
  src/App.tsx → src/pages/Projects.tsx

## Import Cycles
- None detected.

## Communities (20 total, 13 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (23): compilerOptions, allowJs, allowSyntheticDefaultImports, declaration, declarationMap, emitDecoratorMetadata, esModuleInterop, experimentalDecorators (+15 more)

### Community 1 - "Community 1"
Cohesion: 0.24
Nodes (9): react, react-router-dom, App(), Header(), About(), Contact(), Home(), PAGES (+1 more)

### Community 2 - "Community 2"
Cohesion: 0.29
Nodes (6): vite@^5.4.10, vite-tsconfig-paths@^6.1.1, @vitejs/plugin-react@^4.3.4, vite, vite-tsconfig-paths, @vitejs/plugin-react

### Community 3 - "Community 3"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 4 - "Community 4"
Cohesion: 0.40
Nodes (5): dependencies, react@^18.3.0, react-dom@^18.3.0, react-router-dom@^6.28.0, react-dom

### Community 5 - "Community 5"
Cohesion: 0.40
Nodes (5): devDependencies, eslint@^9.14.0, vitest@^5.1.0, eslint, vitest

### Community 6 - "Community 6"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, preview

## Knowledge Gaps
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react-router-dom` connect `Community 1` to `Community 3`, `Community 4`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._
- **Why does `devDependencies` connect `Community 5` to `Community 2`, `Community 3`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 14`, `Community 15`, `Community 16`, `Community 17`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `compilerOptions` connect `Community 0` to `Community 8`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
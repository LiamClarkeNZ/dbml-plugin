<!-- Keep a Changelog guide -> https://keepachangelog.com -->

# dbml-plugin Changelog

## [Unreleased]

### Fixed

- Schema-qualified column types such as `customer.some_enum` no longer report a syntax error ([#39](https://github.com/LiamClarkeNZ/dbml-plugin/issues/39))

## [0.2.0] - 2026-10-05

### Added

- Live entity-relationship diagram preview for `.dbml` files, shown in a split editor alongside the source
- Diagram updates as you type
- Tables, enums, and table groups, with relations drawn as edges carrying cardinality markers
- Column badges for primary key, auto increment, unique, and not null, with full-name tooltips
- Click a table, column, or enum to jump to its definition in the source
- Click a column to highlight every relation that touches it, or click a relation to highlight it alone
- DBML colour settings are honoured: table `headercolor`, table group `color`, and ref `color`
- Diagram follows the editor colour scheme and font
- Pan by scrolling, zoom with the toolbar buttons or keyboard, and toggle the minimap

## [0.1.0]

### Added

- DBML language recognition for `.dbml` files across all JetBrains IDEs
- Syntax highlighting for keywords, strings, numbers, comments, operators, colour codes, and expressions
- Escape sequence highlighting in multi-line (triple-quoted) strings
- Colour preview gutter swatches and integrated colour picker for `headercolor` / `color` hex codes
- Parser-based structural validation with human-friendly error messages for malformed DBML
- Full DBML spec support: tables, columns, enums, refs, indexes, table groups, table partials, named notes, project definitions
- Configurable colour scheme under Settings > Editor > Color Scheme > DBML
- Brace matching and auto-close for `{}`, `[]`, `()`
- Line (`//`) and block (`/* */`) comment toggling
- DBML file type icon

[Unreleased]: https://github.com/LiamClarkeNZ/dbml-plugin/compare/0.2.0...HEAD
[0.2.0]: https://github.com/LiamClarkeNZ/dbml-plugin/compare/0.1.0...0.2.0
[0.1.0]: https://github.com/LiamClarkeNZ/dbml-plugin/commits/0.1.0

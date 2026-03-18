# DBML Language Support Plugin - Design Spec

## Overview

IntelliJ Platform plugin providing syntax highlighting and structural validation for DBML (Database Markup Language) files. Targets all JetBrains IDEs (IntelliJ, PyCharm, DataGrip, etc.) via the `com.intellij.modules.platform` dependency.

## Scope (v1)

- Full DBML spec support (tables, columns, enums, refs, indexes, table groups, table partials, named notes, project definition)
- Lexer-based syntax highlighting with user-configurable color scheme
- Parser-based structural validation (error highlighting for malformed DBML)
- Brace matching and comment toggling
- **Not in scope:** Navigation, code completion, refactoring, formatting, semantic validation (duplicate names, invalid references)

## Approach

- **JFlex lexer** for tokenization, wrapped in `FlexAdapter`
- **Grammar-Kit parser** generating `PsiParser` and PSI element classes from a `.bnf` grammar
- **dbml-java** (https://github.com/nilswende/dbml-java) used as a reference for token types and grammar rules, but not as a runtime dependency (its lexer/parser are not compatible with IntelliJ's incremental, position-aware infrastructure). The JFlex lexer and Grammar-Kit grammar will differ structurally from dbml-java's hand-written lexer/parser — dbml-java informs _what_ tokens and grammar rules exist, not _how_ they are implemented.

## Architecture

### Package Structure

```
nz/co/steelsky/dbmlplugin/
  DbmlLanguage.kt              # Language singleton, ID = "DBML"
  DbmlFileType.kt              # LanguageFileType for .dbml files
  DbmlFile.kt                  # PsiFileBase subclass
  DbmlIcons.kt                 # Icon constants (16x16 SVG)
  DbmlBraceMatcher.kt          # PairedBraceMatcher: {} [] ()
  DbmlCommenter.kt             # Line (//) and block (/* */) comments
  lexer/
    Dbml.flex                   # JFlex grammar file
    DbmlLexerAdapter.kt        # FlexAdapter wrapper
    DbmlTokenType.kt           # IElementType subclass for lexer tokens
    DbmlTokenTypes.kt          # IElementType constants for all tokens
    DbmlTokenSets.kt           # TokenSet groupings
  parser/
    Dbml.bnf                   # Grammar-Kit BNF grammar
    DbmlParserDefinition.kt    # ParserDefinition implementation
  psi/
    DbmlElementType.kt         # IElementType subclass for parser (composite) elements
    DbmlTypes.kt               # (generated) element type holder class
    Dbml*.kt                   # (generated) PSI interfaces
    impl/
      Dbml*Impl.kt             # (generated) PSI implementations

  highlighting/
    DbmlSyntaxHighlighter.kt
    DbmlSyntaxHighlighterFactory.kt
    DbmlColorSettingsPage.kt

src/main/gen/                   # Generated source root (Grammar-Kit + JFlex output)
  nz/co/steelsky/dbmlplugin/
    lexer/
      DbmlLexer.java           # (generated from Dbml.flex)
    parser/
      DbmlParser.java          # (generated from Dbml.bnf)
    psi/
      DbmlTypes.java           # (generated) element type holder
      Dbml*.java               # (generated) PSI interfaces
      impl/
        Dbml*Impl.java         # (generated) PSI implementations
```

### 1. Language & File Type Registration

- `DbmlLanguage` — singleton `Language` subclass with ID `"DBML"`
- `DbmlFileType` — `LanguageFileType` registered for `.dbml` extension via `com.intellij.fileType`
- `DbmlFile` — `PsiFileBase` subclass representing a parsed DBML file
- `DbmlIcons` — icon constants for file type display

### 2. Lexer

JFlex-based lexer translating DBML source into tokens. Token types are informed by dbml-java's `TokenType` enum, but the naming conventions and some categorizations are adapted for IntelliJ conventions.

**`DbmlTokenType`** — `IElementType` subclass: `class DbmlTokenType(debugName: String) : IElementType(debugName, DbmlLanguage.INSTANCE)`. Used for all lexer token type constants.

**Token types (defined in `DbmlTokenTypes`):**

- **Keywords:** `PROJECT`, `TABLE`, `AS`, `REF`, `ENUM`, `TABLEGROUP`, `TABLEPARTIAL`, `HEADERCOLOR`, `COLOR`, `NOTE`, `PRIMARY`, `KEY`, `PK`, `NULL`, `NOT`, `UNIQUE`, `DEFAULT`, `INCREMENT`, `INDEXES`, `BTREE`, `HASH`, `TYPE`, `NAME`, `DELETE`, `UPDATE`, `CASCADE`, `RESTRICT`, `SET`, `NO`, `ACTION`
- **Operators/delimiters:** `MINUS`, `LT`, `GT`, `NE` (`<>`), `LPAREN`, `RPAREN`, `LBRACK`, `RBRACK`, `LBRACE`, `RBRACE`, `COLON`, `COMMA`, `DOT`, `TILDE`
- **Literals:** `LITERAL` (identifiers), `NUMBER`
- **Strings:** `SINGLE_QUOTED_STRING`, `DOUBLE_QUOTED_STRING`, `TRIPLE_QUOTED_STRING`, `EXPRESSION` (backtick-quoted)
- **Other:** `COLOR_CODE`, `LINE_COMMENT`, `BLOCK_COMMENT`, `NEWLINE`, `WHITE_SPACE`, `BAD_CHARACTER`

**Design decisions diverging from dbml-java:**
- `BOOLEAN` is not a separate lexer token. In dbml-java, `true`/`false`/`null` are classified as `BOOLEAN` at parse time (in `TokenAccess.nextLiteral()`), not by the lexer. Our JFlex lexer emits these as `LITERAL`; boolean recognition is deferred to the parser.
- `LINE_COMMENT` and `BLOCK_COMMENT` are separate tokens (dbml-java has a single `COMMENT` type). IntelliJ's `Commenter` interface requires distinguishing between them, and it improves highlighting granularity.
- `NEWLINE` is a distinct token (not folded into `WHITE_SPACE`). This is necessary because DBML is line-break-sensitive in certain contexts (column definitions, index entries, inline refs). See "Line-break sensitivity" below.

**Token sets (defined in `DbmlTokenSets`):**
- `COMMENTS` — `LINE_COMMENT`, `BLOCK_COMMENT`
- `STRINGS` — `SINGLE_QUOTED_STRING`, `DOUBLE_QUOTED_STRING`, `TRIPLE_QUOTED_STRING`
- `KEYWORDS` — all keyword tokens
- `WHITE_SPACES` — `WHITE_SPACE` only (not `NEWLINE`)

**JFlex states:**
- `YYINITIAL` — default, handles keywords, identifiers, numbers, operators, color codes
- `IN_SINGLE_STRING` — inside `'...'`, handles escape sequences
- `IN_DOUBLE_STRING` — inside `"..."`
- `IN_TRIPLE_STRING` — inside `'''...'''`, handles multi-line content and escape sequences
- `IN_EXPRESSION` — inside `` `...` ``
- `IN_LINE_COMMENT` — after `//`, consumes until end of line
- `IN_BLOCK_COMMENT` — inside `/* ... */`, handles nesting

### 3. Parser & PSI

Grammar-Kit BNF grammar mirroring dbml-java's `ParserImpl` recursive descent structure.

**BNF header configuration:**

```
{
  parserClass="nz.co.steelsky.dbmlplugin.parser.DbmlParser"
  extends="com.intellij.extlanguage.psi.impl.ASTWrapperPsiElement"
  psiClassPrefix="Dbml"
  psiImplClassSuffix="Impl"
  psiPackage="nz.co.steelsky.dbmlplugin.psi"
  psiImplPackage="nz.co.steelsky.dbmlplugin.psi.impl"
  elementTypeHolderClass="nz.co.steelsky.dbmlplugin.psi.DbmlTypes"
  elementTypeClass="nz.co.steelsky.dbmlplugin.psi.DbmlElementType"
  tokenTypeClass="nz.co.steelsky.dbmlplugin.lexer.DbmlTokenType"

  tokens = [
    // Token names match constants in DbmlTokenTypes, e.g.:
    // PROJECT, TABLE, LBRACE, RBRACE, LITERAL, NUMBER, etc.
    // Full list derived from DbmlTokenTypes defined in Section 2.
  ]
}
```

**`DbmlElementType`** — `IElementType` subclass for composite (parser) element types: `class DbmlElementType(debugName: String) : IElementType(debugName, DbmlLanguage.INSTANCE)`. Lives in `psi/` package.

**Top-level grammar:**

```
dbmlFile ::= item*
private item ::= project | table | ref | enum | tableGroup | tablePartial | namedNote
```

(Grammar-Kit uses `private` keyword for rules that should not generate PSI elements.)

**Shared grammar rules:**

```
// Schema-qualified name, used by table, enum, tableGroup, and ref column references
tableName ::= (identifier DOT)? identifier
identifier ::= LITERAL | DOUBLE_QUOTED_STRING
stringLiteral ::= SINGLE_QUOTED_STRING | DOUBLE_QUOTED_STRING | TRIPLE_QUOTED_STRING
```

**Key grammar rules:**

- `project` — optional name, brace-enclosed body with properties and notes
- `table` — schema-qualified name (`tableName`), optional alias, optional settings, brace-enclosed body with columns/indexes/notes/partial refs
- `column` — name, datatype, optional bracket-enclosed settings (pk, not null, unique, increment, default, note, inline ref)
- `ref` — optional name, inline (colon) or braced form, column references with relation operators (`< > - <>`)
- `enum` — schema-qualified name, brace-enclosed values with optional settings
- `indexes` — brace-enclosed list of single or composite index definitions with optional settings
- `tableGroup` — name, optional settings, brace-enclosed table references
- `tablePartial` — name, same body structure as table
- `namedNote` — name, brace-enclosed string value

**Column datatype grammar:**
```
column ::= identifier datatype columnSettings?
datatype ::= identifier (LPAREN datatypeParam (COMMA datatypeParam)* RPAREN)?
datatypeParam ::= LITERAL | NUMBER
columnSettings ::= LBRACK columnSetting (COMMA columnSetting)* RBRACK
```

**Ref grammar detail:** The `ref` rule is the most complex due to multiple forms:
```
ref ::= REF refName? (refInline | refBraced)
refInline ::= COLON refBody
refBraced ::= LBRACE refBody RBRACE
refBody ::= refColumnNames relation refColumnNames refSettings?
refName ::= identifier
relation ::= LT | GT | MINUS | NE
refColumnNames ::= tableName DOT (identifier | LPAREN identifier (COMMA identifier)* RPAREN)
refSettings ::= LBRACK refSetting (COMMA refSetting)* RBRACK
refSetting ::= (DELETE | UPDATE) COLON refAction
             | COLOR COLON COLOR_CODE
refAction ::= CASCADE | RESTRICT
            | SET (NULL | DEFAULT)
            | NO ACTION
```

**Note on NEWLINE in ref:** When a `NEWLINE` appears between `REF` (or the ref name) and the body delimiter, only the braced form (`LBRACE`) is valid. The inline colon form requires `REF ... : ...` on a single logical line, matching dbml-java's behavior (`if (linebreak && typeIs(COLON)) expected(LBRACE)`).

Grammar-Kit's `pin` and `recoverWhile` attributes provide error recovery for structural validation.

**Line-break sensitivity:** DBML uses newlines as implicit delimiters in certain contexts (column definitions within a table body, index entries, enum values). The JFlex lexer emits `NEWLINE` as a distinct token. The grammar handles this by:
- Using `NEWLINE` explicitly as a delimiter in line-break-sensitive rules (e.g. between columns in a table body, between index entries)
- Everywhere else, `NEWLINE` is consumed as whitespace via `PsiBuilder` configuration

This mirrors dbml-java's `LinebreakMode` toggle but through Grammar-Kit's declarative grammar instead of imperative parser state.

**`DbmlParserDefinition`** wires together:
- `getFileNodeType()` → static `IFileElementType(DbmlLanguage.INSTANCE)` constant
- `createLexer()` → `DbmlLexerAdapter`
- `createParser()` → Grammar-Kit generated `DbmlParser`
- `createFile()` → `DbmlFile`
- `createElement()` → Grammar-Kit generated PSI factory (`DbmlTypes.Factory`)
- `getCommentTokens()` → `DbmlTokenSets.COMMENTS`
- `getStringLiteralElements()` → `DbmlTokenSets.STRINGS`
- `getWhitespaceTokens()` → `DbmlTokenSets.WHITE_SPACES` (contains only `WHITE_SPACE`, not `NEWLINE`)

### 4. Syntax Highlighting

**Lexer-based highlighting** via `DbmlSyntaxHighlighter`:

| Token group | Default style |
|---|---|
| Keywords | Bold, keyword color |
| Identifiers (LITERAL) | Default text |
| Numbers | Number color |
| Strings (single, double, triple quoted) | String color |
| Expression (backtick) | String color, italic |
| Comments (line, block) | Comment color, italic |
| Operators | Operator color |
| Braces/brackets/parens | Brace color |
| Color codes | String color |
| BAD_CHARACTER | Red underline |

`NEWLINE` maps to an empty `TextAttributesKey` array (no special highlighting).

**Parser-based error highlighting** — Grammar-Kit automatically marks unexpected tokens as errors. No custom annotator needed for v1.

**`DbmlColorSettingsPage`** — user-configurable color scheme under Settings > Editor > Color Scheme > DBML, with a demo DBML snippet showing all token types.

### 5. Brace Matching & Commenter

- `DbmlBraceMatcher` — implements `PairedBraceMatcher` interface, returns `BracePair` instances for `{}`/`[]`/`()`. Enables highlight-on-hover and auto-close.
- `DbmlCommenter` — implements `Commenter`, provides `//` for line comments, `/* */` for block comments. Enables Cmd+/ toggling.

## Plugin Configuration

**`plugin.xml` extensions:**

```xml
<extensions defaultExtensionNs="com.intellij">
    <fileType implementationClass="nz.co.steelsky.dbmlplugin.DbmlFileType"
              name="DBML" language="DBML" extensions="dbml" fieldName="INSTANCE"/>
    <lang.parserDefinition language="DBML"
              implementationClass="nz.co.steelsky.dbmlplugin.parser.DbmlParserDefinition"/>
    <lang.syntaxHighlighterFactory language="DBML"
              implementationClass="nz.co.steelsky.dbmlplugin.highlighting.DbmlSyntaxHighlighterFactory"/>
    <colorSettingsPage
              implementation="nz.co.steelsky.dbmlplugin.highlighting.DbmlColorSettingsPage"/>
    <lang.braceMatcher language="DBML"
              implementationClass="nz.co.steelsky.dbmlplugin.DbmlBraceMatcher"/>
    <lang.commenter language="DBML"
              implementationClass="nz.co.steelsky.dbmlplugin.DbmlCommenter"/>
</extensions>
```

## Build Changes

- `gradle.properties`: `pluginGroup` → `nz.co.steelsky.dbmlplugin`
- `build.gradle.kts`:
  - Add `org.jetbrains.grammarkit` Gradle plugin for Grammar-Kit and JFlex code generation
  - Configure `generateLexer` task: source = `src/main/kotlin/.../lexer/Dbml.flex`, output to `src/main/gen/`
  - Configure `generateParser` task: source = `src/main/kotlin/.../parser/Dbml.bnf`, output to `src/main/gen/`
  - Add `src/main/gen` as a source root via `sourceSets`
  - Add `src/main/gen` to `.gitignore` (generated code should not be committed)
- `gradle/libs.versions.toml`: Add `grammarkit` plugin version entry
- Package rename from `com.github.liamclarkenz.dbmlplugin` to `nz.co.steelsky.dbmlplugin`
- Remove all template scaffolding (MyBundle, MyBundle.properties, MyProjectService, MyProjectActivity, MyToolWindowFactory, MyPluginTest, test data)

## Testing

- `DbmlLexerTest.kt` — verify token streams for representative DBML snippets covering all token types
- `DbmlParserTest.kt` — verify PSI tree structure, confirm valid DBML parses without errors, confirm invalid DBML produces error elements
- `DbmlHighlightingTest.kt` — verify syntax highlighting attribute mappings
- Test fixtures: sample `.dbml` files covering all constructs

## Reference

- dbml-java source (lexer, parser, token types): https://github.com/nilswende/dbml-java
- IntelliJ custom language support: https://plugins.jetbrains.com/docs/intellij/custom-language-support.html
- Grammar-Kit: https://github.com/JetBrains/Grammar-Kit
- DBML specification: https://dbml.dbdiagram.io/docs/

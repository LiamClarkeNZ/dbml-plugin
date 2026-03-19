# DBML Language Support Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add syntax highlighting and structural validation for DBML files in JetBrains IDEs.

**Architecture:** JFlex lexer tokenises DBML source, Grammar-Kit parser builds a PSI tree from those tokens, and a `SyntaxHighlighter` maps token types to editor colours. Parser errors surface automatically as red error highlights.

**Tech Stack:** Kotlin, IntelliJ Platform SDK 2025.2, JFlex (via Grammar-Kit Gradle plugin), Grammar-Kit BNF parser generator.

**Spec:** `docs/superpowers/specs/2026-03-19-dbml-language-support-design.md`

**Reference codebase:** `~/dev/dbml-java/` (read-only) — specifically `src/main/java/com/wn/dbml/compiler/` for token types, lexer logic, and parser grammar.

---

## File Map

### Files to delete (template scaffolding)
- `src/main/kotlin/com/github/liamclarkenz/dbmlplugin/` (entire directory)
- `src/main/resources/messages/MyBundle.properties`
- `src/test/kotlin/com/github/liamclarkenz/dbmlplugin/` (entire directory)
- `src/test/testData/rename/` (entire directory)

### Files to modify
- `gradle.properties` — update `pluginGroup`, `pluginName`, `pluginRepositoryUrl`
- `gradle/libs.versions.toml` — add `grammarKit` plugin entry
- `build.gradle.kts` — add Grammar-Kit plugin, `generateLexer`/`generateParser` tasks, `src/main/gen` source root
- `.gitignore` — add `src/main/gen`
- `src/main/resources/META-INF/plugin.xml` — replace template extensions with DBML registrations

### Files to create
- `src/main/kotlin/nz/co/steelsky/dbmlplugin/DbmlLanguage.kt`
- `src/main/kotlin/nz/co/steelsky/dbmlplugin/DbmlFileType.kt`
- `src/main/kotlin/nz/co/steelsky/dbmlplugin/DbmlFile.kt`
- `src/main/kotlin/nz/co/steelsky/dbmlplugin/DbmlIcons.kt`
- `src/main/kotlin/nz/co/steelsky/dbmlplugin/DbmlBraceMatcher.kt`
- `src/main/kotlin/nz/co/steelsky/dbmlplugin/DbmlCommenter.kt`
- `src/main/kotlin/nz/co/steelsky/dbmlplugin/lexer/DbmlTokenType.kt`
- `src/main/kotlin/nz/co/steelsky/dbmlplugin/lexer/DbmlTokenTypes.kt`
- `src/main/kotlin/nz/co/steelsky/dbmlplugin/lexer/DbmlTokenSets.kt`
- `src/main/kotlin/nz/co/steelsky/dbmlplugin/lexer/DbmlLexerAdapter.kt`
- `src/main/kotlin/nz/co/steelsky/dbmlplugin/lexer/Dbml.flex`
- `src/main/kotlin/nz/co/steelsky/dbmlplugin/psi/DbmlElementType.kt`
- `src/main/kotlin/nz/co/steelsky/dbmlplugin/parser/Dbml.bnf`
- `src/main/kotlin/nz/co/steelsky/dbmlplugin/parser/DbmlParserDefinition.kt`
- `src/main/kotlin/nz/co/steelsky/dbmlplugin/highlighting/DbmlSyntaxHighlighter.kt`
- `src/main/kotlin/nz/co/steelsky/dbmlplugin/highlighting/DbmlSyntaxHighlighterFactory.kt`
- `src/main/kotlin/nz/co/steelsky/dbmlplugin/highlighting/DbmlColorSettingsPage.kt`
- `src/main/resources/icons/dbml.svg`
- `src/test/kotlin/nz/co/steelsky/dbmlplugin/lexer/DbmlLexerTest.kt`
- `src/test/kotlin/nz/co/steelsky/dbmlplugin/parser/DbmlParserTest.kt`
- `src/test/kotlin/nz/co/steelsky/dbmlplugin/highlighting/DbmlHighlightingTest.kt`
- `src/test/testData/` — various `.dbml` fixture files

---

## Task 1: Build System & Template Cleanup

**Files:**
- Modify: `gradle.properties`
- Modify: `gradle/libs.versions.toml`
- Modify: `build.gradle.kts`
- Modify: `.gitignore`
- Modify: `CLAUDE.md`
- Delete: `src/main/kotlin/com/github/liamclarkenz/dbmlplugin/` (entire directory)
- Delete: `src/main/resources/messages/MyBundle.properties`
- Delete: `src/test/kotlin/com/github/liamclarkenz/dbmlplugin/` (entire directory)
- Delete: `src/test/testData/rename/` (entire directory)

- [ ] **Step 1: Delete template scaffolding**

```bash
rm -rf src/main/kotlin/com/github/liamclarkenz
rm -f src/main/resources/messages/MyBundle.properties
rm -rf src/test/kotlin/com/github/liamclarkenz
rm -rf src/test/testData/rename
```

- [ ] **Step 2: Update `gradle.properties`**

Change these lines:
```properties
pluginGroup = nz.co.steelsky.dbmlplugin
pluginName = DBML
pluginRepositoryUrl = https://github.com/LiamClarkeNZ/dbml-plugin
```

- [ ] **Step 3: Add Grammar-Kit plugin to version catalogue**

In `gradle/libs.versions.toml`, add under `[versions]`:
```toml
grammarKit = "2023.3.0.3"
```
And under `[plugins]`:
```toml
grammarKit = { id = "org.jetbrains.grammarkit", version.ref = "grammarKit" }
```

- [ ] **Step 4: Update `build.gradle.kts`**

Add Grammar-Kit plugin to the `plugins` block:
```kotlin
alias(libs.plugins.grammarKit) // Grammar-Kit & JFlex code generation
```

Add after the `kotlin { jvmToolchain(21) }` block:
```kotlin
// Add generated source root
sourceSets {
    main {
        java.srcDir("src/main/gen")
    }
}
```

Add after the `tasks { }` block (before `intellijPlatformTesting`):
```kotlin
// Configure Grammar-Kit lexer and parser generation
tasks.register<org.jetbrains.grammarkit.tasks.GenerateLexer>("generateLexer") {
    sourceFile.set(file("src/main/kotlin/nz/co/steelsky/dbmlplugin/lexer/Dbml.flex"))
    targetOutputDir.set(file("src/main/gen/nz/co/steelsky/dbmlplugin/lexer"))
    purgeOldFiles.set(true)
}

tasks.register<org.jetbrains.grammarkit.tasks.GenerateParser>("generateParser") {
    sourceFile.set(file("src/main/kotlin/nz/co/steelsky/dbmlplugin/parser/Dbml.bnf"))
    targetRootOutputDir.set(file("src/main/gen"))
    pathToParser.set("nz/co/steelsky/dbmlplugin/parser/DbmlParser.java")
    pathToPsiRoot.set("nz/co/steelsky/dbmlplugin/psi")
    purgeOldFiles.set(true)
}

tasks.named("compileKotlin") {
    dependsOn("generateLexer", "generateParser")
}

tasks.named("compileJava") {
    dependsOn("generateLexer", "generateParser")
}
```

- [ ] **Step 5: Add `src/main/gen` to `.gitignore`**

Append to `.gitignore`:
```
src/main/gen
```

- [ ] **Step 6: Update `CLAUDE.md`**

Update the package references from `com.github.liamclarkenz.dbmlplugin` to `nz.co.steelsky.dbmlplugin` throughout.

- [ ] **Step 7: Verify the build compiles (with no source yet)**

Run: `./gradlew compileKotlin`
Expected: BUILD SUCCESSFUL (no source files to compile, but Gradle config is valid)

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: clean up template scaffolding and configure Grammar-Kit build"
```

---

## Task 2: Language & File Type Registration

**Files:**
- Create: `src/main/kotlin/nz/co/steelsky/dbmlplugin/DbmlLanguage.kt`
- Create: `src/main/kotlin/nz/co/steelsky/dbmlplugin/DbmlFileType.kt`
- Create: `src/main/kotlin/nz/co/steelsky/dbmlplugin/DbmlFile.kt`
- Create: `src/main/kotlin/nz/co/steelsky/dbmlplugin/DbmlIcons.kt`
- Create: `src/main/resources/icons/dbml.svg`
- Modify: `src/main/resources/META-INF/plugin.xml`

- [ ] **Step 1: Create `DbmlLanguage.kt`**

```kotlin
package nz.co.steelsky.dbmlplugin

import com.intellij.lang.Language

object DbmlLanguage : Language("DBML") {
    private fun readResolve(): Any = DbmlLanguage
}
```

- [ ] **Step 2: Create `DbmlIcons.kt`**

```kotlin
package nz.co.steelsky.dbmlplugin

import com.intellij.openapi.util.IconLoader

object DbmlIcons {
    @JvmField
    val FILE = IconLoader.getIcon("/icons/dbml.svg", javaClass)
}
```

- [ ] **Step 3: Create `src/main/resources/icons/dbml.svg`**

A simple 16x16 SVG icon representing a database/DBML file. Use a minimal database cylinder icon:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
  <ellipse cx="8" cy="4" rx="6" ry="2.5" fill="#6B9BD2" stroke="#4A7AB5" stroke-width="0.8"/>
  <path d="M2 4v8c0 1.38 2.69 2.5 6 2.5s6-1.12 6-2.5V4" fill="#6B9BD2" stroke="#4A7AB5" stroke-width="0.8"/>
  <ellipse cx="8" cy="12" rx="6" ry="2.5" fill="none" stroke="#4A7AB5" stroke-width="0.8"/>
  <path d="M2 8c0 1.38 2.69 2.5 6 2.5s6-1.12 6-2.5" fill="none" stroke="#4A7AB5" stroke-width="0.8"/>
</svg>
```

- [ ] **Step 4: Create `DbmlFileType.kt`**

```kotlin
package nz.co.steelsky.dbmlplugin

import com.intellij.openapi.fileTypes.LanguageFileType
import javax.swing.Icon

object DbmlFileType : LanguageFileType(DbmlLanguage) {
    override fun getName(): String = "DBML"
    override fun getDescription(): String = "Database Markup Language"
    override fun getDefaultExtension(): String = "dbml"
    override fun getIcon(): Icon = DbmlIcons.FILE
}
```

- [ ] **Step 5: Create `DbmlFile.kt`**

```kotlin
package nz.co.steelsky.dbmlplugin

import com.intellij.extapi.psi.PsiFileBase
import com.intellij.openapi.fileTypes.FileType
import com.intellij.psi.FileViewProvider

class DbmlFile(viewProvider: FileViewProvider) : PsiFileBase(viewProvider, DbmlLanguage) {
    override fun getFileType(): FileType = DbmlFileType
    override fun toString(): String = "DBML File"
}
```

- [ ] **Step 6: Update `plugin.xml`**

Replace the entire contents with:
```xml
<!-- Plugin Configuration File. Read more: https://plugins.jetbrains.com/docs/intellij/plugin-configuration-file.html -->
<idea-plugin>
    <id>nz.co.steelsky.dbmlplugin</id>
    <name>DBML</name>
    <vendor>steelsky</vendor>

    <depends>com.intellij.modules.platform</depends>

    <extensions defaultExtensionNs="com.intellij">
        <fileType implementationClass="nz.co.steelsky.dbmlplugin.DbmlFileType"
                  name="DBML" language="DBML" extensions="dbml" fieldName="INSTANCE"/>
    </extensions>
</idea-plugin>
```

- [ ] **Step 7: Verify the build compiles**

Run: `./gradlew compileKotlin`
Expected: BUILD SUCCESSFUL

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add DBML language and file type registration"
```

---

## Task 3: Lexer Token Types & Adapter

**Files:**
- Create: `src/main/kotlin/nz/co/steelsky/dbmlplugin/lexer/DbmlTokenType.kt`
- Create: `src/main/kotlin/nz/co/steelsky/dbmlplugin/lexer/DbmlTokenTypes.kt`
- Create: `src/main/kotlin/nz/co/steelsky/dbmlplugin/lexer/DbmlTokenSets.kt`
- Create: `src/main/kotlin/nz/co/steelsky/dbmlplugin/lexer/DbmlLexerAdapter.kt` (created in Task 4, after lexer generation)

- [ ] **Step 1: Create `DbmlTokenType.kt`**

```kotlin
package nz.co.steelsky.dbmlplugin.lexer

import com.intellij.psi.tree.IElementType
import nz.co.steelsky.dbmlplugin.DbmlLanguage

class DbmlTokenType(debugName: String) : IElementType(debugName, DbmlLanguage)
```

- [ ] **Step 2: Create `DbmlTokenTypes.kt`**

Most token type constants are generated by Grammar-Kit into `DbmlTypes` (in `src/main/gen`). `DbmlTokenTypes` only holds tokens NOT declared in the BNF `tokens` block — `WHITE_SPACE` and `BAD_CHARACTER`:

```kotlin
package nz.co.steelsky.dbmlplugin.lexer

import com.intellij.psi.TokenType

object DbmlTokenTypes {
    // Standard IntelliJ types — not in the BNF grammar
    @JvmField val WHITE_SPACE = TokenType.WHITE_SPACE
    @JvmField val BAD_CHARACTER = TokenType.BAD_CHARACTER
}
```

- [ ] **Step 3: Create `DbmlTokenSets.kt`**

Note: This file imports from `DbmlTypes` (Grammar-Kit generated) for all DBML tokens, and from `DbmlTokenTypes` only for `WHITE_SPACE`.

```kotlin
package nz.co.steelsky.dbmlplugin.lexer

import com.intellij.psi.tree.TokenSet
import nz.co.steelsky.dbmlplugin.psi.DbmlTypes

object DbmlTokenSets {
    @JvmField
    val COMMENTS = TokenSet.create(DbmlTypes.LINE_COMMENT, DbmlTypes.BLOCK_COMMENT)

    @JvmField
    val STRINGS = TokenSet.create(
        DbmlTypes.SINGLE_QUOTED_STRING,
        DbmlTypes.DOUBLE_QUOTED_STRING,
        DbmlTypes.TRIPLE_QUOTED_STRING,
    )

    @JvmField
    val KEYWORDS = TokenSet.create(
        DbmlTypes.PROJECT, DbmlTypes.TABLE, DbmlTypes.AS,
        DbmlTypes.REF, DbmlTypes.ENUM, DbmlTypes.TABLEGROUP,
        DbmlTypes.TABLEPARTIAL, DbmlTypes.HEADERCOLOR, DbmlTypes.COLOR,
        DbmlTypes.NOTE, DbmlTypes.PRIMARY, DbmlTypes.KEY,
        DbmlTypes.PK, DbmlTypes.NULL, DbmlTypes.NOT,
        DbmlTypes.UNIQUE, DbmlTypes.DEFAULT, DbmlTypes.INCREMENT,
        DbmlTypes.INDEXES, DbmlTypes.BTREE, DbmlTypes.HASH,
        DbmlTypes.TYPE, DbmlTypes.NAME, DbmlTypes.DELETE,
        DbmlTypes.UPDATE, DbmlTypes.CASCADE, DbmlTypes.RESTRICT,
        DbmlTypes.SET, DbmlTypes.NO, DbmlTypes.ACTION,
    )

    @JvmField
    val WHITE_SPACES = TokenSet.create(DbmlTokenTypes.WHITE_SPACE)
}
```

- [ ] **Step 4: Verify `DbmlTokenType` and `DbmlTokenTypes` compile**

Run: `./gradlew compileKotlin`
Expected: BUILD FAILURE — `DbmlTokenSets.kt` references `DbmlTypes` which does not exist yet (generated in Task 5). This is expected. Verify the error is only about unresolved `DbmlTypes` references, not about `DbmlTokenType` or `DbmlTokenTypes`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add DBML lexer token types and token sets"
```

---

## Task 4: JFlex Lexer Grammar

**Files:**
- Create: `src/main/kotlin/nz/co/steelsky/dbmlplugin/lexer/Dbml.flex`
- Create: `src/main/kotlin/nz/co/steelsky/dbmlplugin/lexer/DbmlLexerAdapter.kt`
- Test: `src/test/kotlin/nz/co/steelsky/dbmlplugin/lexer/DbmlLexerTest.kt`

Reference: `~/dev/dbml-java/src/main/java/com/wn/dbml/compiler/lexer/LexerImpl.java` for tokenisation rules, `~/dev/dbml-java/src/main/java/com/wn/dbml/util/Char.java` for character classes.

- [ ] **Step 1: Create `Dbml.flex`**

The JFlex grammar uses `%{` / `%}` blocks with a `StringBuilder` to accumulate string/comment content and return a single token per literal. This avoids the need for `MergingLexerAdapter`.

```
package nz.co.steelsky.dbmlplugin.lexer;

import com.intellij.lexer.FlexLexer;
import com.intellij.psi.tree.IElementType;

import static nz.co.steelsky.dbmlplugin.psi.DbmlTypes.*;
import static com.intellij.psi.TokenType.BAD_CHARACTER;
import static com.intellij.psi.TokenType.WHITE_SPACE;

%%

%class DbmlLexer
%implements FlexLexer
%unicode
%function advance
%type IElementType

%state IN_SINGLE_STRING
%state IN_DOUBLE_STRING
%state IN_TRIPLE_STRING
%state IN_EXPRESSION
%state IN_BLOCK_COMMENT

// Character classes (from dbml-java Char.java — ASCII subset is sufficient for v1)
DIGIT = [0-9]
HEX_DIGIT = [0-9a-fA-F]
WORD_CHAR = [a-zA-Z0-9_]
WHITE_SPACE_CHAR = [ \t]
NEWLINE_CHAR = [\n\r]

// Composite patterns
INTEGER = {DIGIT}+
NUMBER = {INTEGER} ("." {INTEGER})?
WORD = {WORD_CHAR}+
COLOR_CODE_BODY = {HEX_DIGIT}{6} | {HEX_DIGIT}{3}

%%

// === YYINITIAL state ===
<YYINITIAL> {
    // Whitespace
    {WHITE_SPACE_CHAR}+         { return WHITE_SPACE; }
    {NEWLINE_CHAR}              { return NEWLINE; }

    // Line comments — handled entirely in YYINITIAL (no state needed)
    "//" [^\n\r]*               { return LINE_COMMENT; }
    // Block comments — opening delimiter transitions state without returning a token.
    // The closing "*/" in IN_BLOCK_COMMENT returns BLOCK_COMMENT covering the full literal.
    "/*"                        { yybegin(IN_BLOCK_COMMENT); }

    // Multi-character operators
    "<>"                        { return NE; }

    // Single-character operators and delimiters
    "-"                         { return MINUS; }
    "<"                         { return LT; }
    ">"                         { return GT; }
    "("                         { return LPAREN; }
    ")"                         { return RPAREN; }
    "["                         { return LBRACK; }
    "]"                         { return RBRACK; }
    "{"                         { return LBRACE; }
    "}"                         { return RBRACE; }
    ":"                         { return COLON; }
    ","                         { return COMMA; }
    "."                         { return DOT; }
    "~"                         { return TILDE; }

    // Colour codes (6-digit before 3-digit for longest match)
    "#" {COLOR_CODE_BODY}       { return COLOR_CODE; }

    // Strings — triple-quoted MUST come before single-quoted
    // Opening delimiters do NOT return a token — they just transition state.
    // The state's closing rule returns the token covering the entire literal.
    "'''"                       { yybegin(IN_TRIPLE_STRING); }
    "'"                         { yybegin(IN_SINGLE_STRING); }
    "\""                        { yybegin(IN_DOUBLE_STRING); }
    "`"                         { yybegin(IN_EXPRESSION); }

    // Numbers (before WORD so pure digit sequences match as NUMBER)
    {NUMBER}                    { return NUMBER; }

    // Keywords (case-insensitive, longest-first to avoid partial matches)
    [Tt][Aa][Bb][Ll][Ee][Gg][Rr][Oo][Uu][Pp]                   { return TABLEGROUP; }
    [Tt][Aa][Bb][Ll][Ee][Pp][Aa][Rr][Tt][Ii][Aa][Ll]           { return TABLEPARTIAL; }
    [Hh][Ee][Aa][Dd][Ee][Rr][Cc][Oo][Ll][Oo][Rr]               { return HEADERCOLOR; }
    [Ii][Nn][Cc][Rr][Ee][Mm][Ee][Nn][Tt]                        { return INCREMENT; }
    [Rr][Ee][Ss][Tt][Rr][Ii][Cc][Tt]                            { return RESTRICT; }
    [Dd][Ee][Ff][Aa][Uu][Ll][Tt]                                { return DEFAULT; }
    [Cc][Aa][Ss][Cc][Aa][Dd][Ee]                                { return CASCADE; }
    [Pp][Rr][Oo][Jj][Ee][Cc][Tt]                                { return PROJECT; }
    [Pp][Rr][Ii][Mm][Aa][Rr][Yy]                                { return PRIMARY; }
    [Ii][Nn][Dd][Ee][Xx][Ee][Ss]                                { return INDEXES; }
    [Uu][Nn][Ii][Qq][Uu][Ee]                                    { return UNIQUE; }
    [Dd][Ee][Ll][Ee][Tt][Ee]                                    { return DELETE; }
    [Uu][Pp][Dd][Aa][Tt][Ee]                                    { return UPDATE; }
    [Aa][Cc][Tt][Ii][Oo][Nn]                                    { return ACTION; }
    [Cc][Oo][Ll][Oo][Rr]                                        { return COLOR; }
    [Tt][Aa][Bb][Ll][Ee]                                        { return TABLE; }
    [Bb][Tt][Rr][Ee][Ee]                                        { return BTREE; }
    [Nn][Oo][Tt][Ee]                                            { return NOTE; }
    [Ee][Nn][Uu][Mm]                                            { return ENUM; }
    [Hh][Aa][Ss][Hh]                                            { return HASH; }
    [Tt][Yy][Pp][Ee]                                            { return TYPE; }
    [Nn][Aa][Mm][Ee]                                            { return NAME; }
    [Nn][Uu][Ll][Ll]                                            { return NULL; }
    [Nn][Oo][Tt]                                                { return NOT; }
    [Ss][Ee][Tt]                                                { return SET; }
    [Rr][Ee][Ff]                                                { return REF; }
    [Kk][Ee][Yy]                                                { return KEY; }
    [Pp][Kk]                                                    { return PK; }
    [Nn][Oo]                                                    { return NO; }
    [Aa][Ss]                                                    { return AS; }

    // Identifiers (any word that didn't match a keyword — JFlex longest-match ensures
    // "table_name" matches WORD not TABLE, because WORD is 10 chars vs TABLE's 5)
    {WORD}                      { return LITERAL; }

    // Catch-all
    [^]                         { return BAD_CHARACTER; }
}

// === String states ===
// Opening delimiters in YYINITIAL do NOT return a token — they just transition state.
// Each state matches content without returning. Since zzStartRead is set at the start
// of each advance() call, when the closing delimiter returns a token type, the token
// spans from the opening delimiter through the closing delimiter — one token per literal.
// If EOF is hit before the closing delimiter, return BAD_CHARACTER.

<IN_SINGLE_STRING> {
    "\\'"                       { /* escaped quote, continue */ }
    "\\\\"                      { /* escaped backslash, continue */ }
    "'"                         { yybegin(YYINITIAL); return SINGLE_QUOTED_STRING; }
    [^\\'\n\r]+                 { /* content, continue */ }
    [\n\r]                      { yybegin(YYINITIAL); return BAD_CHARACTER; }
    <<EOF>>                     { yybegin(YYINITIAL); return BAD_CHARACTER; }
    [^]                         { /* any other char, continue */ }
}

<IN_DOUBLE_STRING> {
    "\\\""                      { /* escaped quote, continue */ }
    "\\\\"                      { /* escaped backslash, continue */ }
    "\""                        { yybegin(YYINITIAL); return DOUBLE_QUOTED_STRING; }
    [^\\\"\n\r]+                { /* content, continue */ }
    [\n\r]                      { yybegin(YYINITIAL); return BAD_CHARACTER; }
    <<EOF>>                     { yybegin(YYINITIAL); return BAD_CHARACTER; }
    [^]                         { /* any other char, continue */ }
}

<IN_TRIPLE_STRING> {
    "\\'''"                     { /* escaped triple quote, continue */ }
    "\\\\"                      { /* escaped backslash, continue */ }
    "'''"                       { yybegin(YYINITIAL); return TRIPLE_QUOTED_STRING; }
    <<EOF>>                     { yybegin(YYINITIAL); return BAD_CHARACTER; }
    [^]                         { /* any char including newlines, continue */ }
}

<IN_EXPRESSION> {
    "\\`"                       { /* escaped backtick, continue */ }
    "\\\\"                      { /* escaped backslash, continue */ }
    "`"                         { yybegin(YYINITIAL); return EXPRESSION; }
    [^\\`\n\r]+                 { /* content, continue */ }
    [\n\r]                      { yybegin(YYINITIAL); return BAD_CHARACTER; }
    <<EOF>>                     { yybegin(YYINITIAL); return BAD_CHARACTER; }
    [^]                         { /* any other char, continue */ }
}

// === Block comment state ===
<IN_BLOCK_COMMENT> {
    "*/"                        { yybegin(YYINITIAL); return BLOCK_COMMENT; }
    <<EOF>>                     { yybegin(YYINITIAL); return BAD_CHARACTER; }
    [^]                         { /* any char, continue */ }
}
```

**Important notes for the implementer:**
- The opening delimiter rules for strings and block comments do NOT return a token — they just call `yybegin(STATE)`. The state accumulates content, and the closing delimiter rule returns the token type. Since `zzStartRead` is set at the beginning of each `advance()` call, the returned token spans from the opening delimiter through the closing delimiter, producing a single token per literal.
- **Token identity:** The flex file imports from `nz.co.steelsky.dbmlplugin.psi.DbmlTypes` (the Grammar-Kit generated type holder), NOT from `DbmlTokenTypes`. This is critical — the parser checks against `DbmlTypes.TABLE` etc., so the lexer must return the same `IElementType` instances. `DbmlTokenTypes` only holds `WHITE_SPACE` and `BAD_CHARACTER`. `NEWLINE` is declared in the BNF `tokens` block, so it lives in `DbmlTypes`.
- Keywords are case-insensitive (dbml-java normalises to uppercase). JFlex longest-match ensures `table_name` → `LITERAL` not `TABLE`.
- `WORD_CHAR` uses ASCII `[a-zA-Z0-9_]` which covers typical DBML identifiers. This is a deliberate simplification from dbml-java's `Character.isLetter()` Unicode support.

- [ ] **Step 2: Create `DbmlLexerAdapter.kt`**

```kotlin
package nz.co.steelsky.dbmlplugin.lexer

import com.intellij.lexer.FlexAdapter

class DbmlLexerAdapter : FlexAdapter(DbmlLexer(null))
```

- [ ] **Step 3: Run the `generateLexer` Gradle task**

Run: `./gradlew generateLexer`
Expected: BUILD SUCCESSFUL, `src/main/gen/nz/co/steelsky/dbmlplugin/lexer/DbmlLexer.java` is generated.

If JFlex reports errors, fix the `.flex` file and re-run.

- [ ] **Step 4: Verify the full project compiles**

Run: `./gradlew compileKotlin`
Expected: BUILD SUCCESSFUL (DbmlLexerAdapter can now resolve DbmlLexer)

- [ ] **Step 5: Write lexer test**

Create `src/test/kotlin/nz/co/steelsky/dbmlplugin/lexer/DbmlLexerTest.kt`:

```kotlin
package nz.co.steelsky.dbmlplugin.lexer

import com.intellij.testFramework.LexerTestCase

class DbmlLexerTest : LexerTestCase() {
    override fun createLexer() = DbmlLexerAdapter()
    override fun getDirPath() = "src/test/testData/lexer"

    fun testKeywords() {
        doTest(
            "Table Enum Ref Project",
            """TABLE ('Table')
WHITE_SPACE (' ')
ENUM ('Enum')
WHITE_SPACE (' ')
REF ('Ref')
WHITE_SPACE (' ')
PROJECT ('Project')"""
        )
    }

    fun testOperators() {
        doTest(
            "< > - <>",
            """LT ('<')
WHITE_SPACE (' ')
GT ('>')
WHITE_SPACE (' ')
MINUS ('-')
WHITE_SPACE (' ')
NE ('<>')"""
        )
    }

    fun testNumbers() {
        doTest(
            "42 3.14",
            """NUMBER ('42')
WHITE_SPACE (' ')
NUMBER ('3.14')"""
        )
    }

    fun testComments() {
        doTest(
            "// line comment\n/* block */",
            """LINE_COMMENT ('// line comment')
NEWLINE ('\n')
BLOCK_COMMENT ('/* block */')"""
        )
    }

    fun testColorCode() {
        doTest(
            "#fff #aabbcc",
            """COLOR_CODE ('#fff')
WHITE_SPACE (' ')
COLOR_CODE ('#aabbcc')"""
        )
    }

    fun testIdentifiersAndNewlines() {
        doTest(
            "my_table\nmy_column",
            """LITERAL ('my_table')
NEWLINE ('\n')
LITERAL ('my_column')"""
        )
    }

    fun testTableDefinition() {
        doTest(
            "Table users {\n  id integer [pk]\n}",
            """TABLE ('Table')
WHITE_SPACE (' ')
LITERAL ('users')
WHITE_SPACE (' ')
LBRACE ('{')
NEWLINE ('\n')
WHITE_SPACE ('  ')
LITERAL ('id')
WHITE_SPACE (' ')
LITERAL ('integer')
WHITE_SPACE (' ')
LBRACK ('[')
PK ('pk')
RBRACK (']')
NEWLINE ('\n')
RBRACE ('}')"""
        )
    }
}
```

**Note to implementer:** The exact token text representation may vary depending on how the lexer handles string accumulation. Run the tests, compare actual vs expected output, and adjust. The token TYPE ordering is what matters most. String literal tests are intentionally omitted here — they depend on the final lexer approach (state-based vs regex) and should be added once the lexer is generating correctly.

- [ ] **Step 6: Run the lexer tests**

Run: `./gradlew test --tests "nz.co.steelsky.dbmlplugin.lexer.DbmlLexerTest"`
Expected: All tests pass. If any fail, adjust the `.flex` file or expected test output.

- [ ] **Step 7: Add string literal tests once basic tests pass**

Add additional test methods for strings, expressions, and edge cases. Verify the output format first with a simple string, then build up the test suite.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add JFlex lexer grammar and lexer tests"
```

---

## Task 5: PSI Element Type & BNF Grammar

**Files:**
- Create: `src/main/kotlin/nz/co/steelsky/dbmlplugin/psi/DbmlElementType.kt`
- Create: `src/main/kotlin/nz/co/steelsky/dbmlplugin/parser/Dbml.bnf`

Reference: `~/dev/dbml-java/src/main/java/com/wn/dbml/compiler/parser/ParserImpl.java` for grammar rules.

- [ ] **Step 1: Create `DbmlElementType.kt`**

```kotlin
package nz.co.steelsky.dbmlplugin.psi

import com.intellij.psi.tree.IElementType
import nz.co.steelsky.dbmlplugin.DbmlLanguage

class DbmlElementType(debugName: String) : IElementType(debugName, DbmlLanguage)
```

- [ ] **Step 2: Create `Dbml.bnf`**

This is the Grammar-Kit BNF grammar. It must encode the full DBML spec, using `pin` and `recoverWhile` for error recovery. The grammar is informed by dbml-java's `ParserImpl` but expressed declaratively.

```bnf
{
  parserClass="nz.co.steelsky.dbmlplugin.parser.DbmlParser"
  extends="com.intellij.extapi.psi.ASTWrapperPsiElement"
  psiClassPrefix="Dbml"
  psiImplClassSuffix="Impl"
  psiPackage="nz.co.steelsky.dbmlplugin.psi"
  psiImplPackage="nz.co.steelsky.dbmlplugin.psi.impl"
  elementTypeHolderClass="nz.co.steelsky.dbmlplugin.psi.DbmlTypes"
  elementTypeClass="nz.co.steelsky.dbmlplugin.psi.DbmlElementType"
  tokenTypeClass="nz.co.steelsky.dbmlplugin.lexer.DbmlTokenType"

  tokens = [
    PROJECT="PROJECT"
    TABLE="TABLE"
    AS="AS"
    REF="REF"
    ENUM="ENUM"
    TABLEGROUP="TABLEGROUP"
    TABLEPARTIAL="TABLEPARTIAL"
    HEADERCOLOR="HEADERCOLOR"
    COLOR="COLOR"
    NOTE="NOTE"
    PRIMARY="PRIMARY"
    KEY="KEY"
    PK="PK"
    NULL="NULL"
    NOT="NOT"
    UNIQUE="UNIQUE"
    DEFAULT="DEFAULT"
    INCREMENT="INCREMENT"
    INDEXES="INDEXES"
    BTREE="BTREE"
    HASH="HASH"
    TYPE="TYPE"
    NAME="NAME"
    DELETE="DELETE"
    UPDATE="UPDATE"
    CASCADE="CASCADE"
    RESTRICT="RESTRICT"
    SET="SET"
    NO="NO"
    ACTION="ACTION"
    MINUS="MINUS"
    LT="LT"
    GT="GT"
    NE="NE"
    LPAREN="LPAREN"
    RPAREN="RPAREN"
    LBRACK="LBRACK"
    RBRACK="RBRACK"
    LBRACE="LBRACE"
    RBRACE="RBRACE"
    COLON="COLON"
    COMMA="COMMA"
    DOT="DOT"
    TILDE="TILDE"
    LITERAL="LITERAL"
    NUMBER="NUMBER"
    SINGLE_QUOTED_STRING="SINGLE_QUOTED_STRING"
    DOUBLE_QUOTED_STRING="DOUBLE_QUOTED_STRING"
    TRIPLE_QUOTED_STRING="TRIPLE_QUOTED_STRING"
    EXPRESSION="EXPRESSION"
    COLOR_CODE="COLOR_CODE"
    LINE_COMMENT="LINE_COMMENT"
    BLOCK_COMMENT="BLOCK_COMMENT"
    NEWLINE="NEWLINE"
  ]
}

// Root
dbmlFile ::= item_*
private item_ ::= (project | table_definition | ref_definition | enum_definition
                   | table_group | table_partial | named_note)
                   {recoverWhile=item_recover_}
private item_recover_ ::= !(PROJECT | TABLE | REF | ENUM | TABLEGROUP | TABLEPARTIAL | NOTE | <<eof>>)

// === Shared rules ===
private identifier_ ::= LITERAL | DOUBLE_QUOTED_STRING
table_name ::= identifier_ (DOT identifier_)?
private string_literal_ ::= SINGLE_QUOTED_STRING | DOUBLE_QUOTED_STRING | TRIPLE_QUOTED_STRING
private nl_ ::= NEWLINE+

// === Project ===
project ::= PROJECT identifier_? LBRACE project_body RBRACE {pin=1}
private project_body ::= (project_property | project_note | nl_)*
project_property ::= LITERAL COLON string_literal_ {pin=2}
private project_note ::= NOTE note_value

// === Table ===
table_definition ::= TABLE table_name table_alias? table_settings? LBRACE table_body RBRACE {pin=1}
table_alias ::= AS identifier_
table_settings ::= LBRACK table_setting (COMMA table_setting)* RBRACK {pin=1}
table_setting ::= HEADERCOLOR COLON COLOR_CODE | NOTE COLON string_literal_
private table_body ::= (column_definition | table_partial_ref | indexes_definition | table_note | nl_)*
private table_note ::= NOTE note_value
table_partial_ref ::= TILDE LITERAL

// === Column ===
column_definition ::= identifier_ column_datatype column_settings? {pin=1}
column_datatype ::= identifier_ (LPAREN datatype_param (COMMA datatype_param)* RPAREN)?
private datatype_param ::= LITERAL | NUMBER
column_settings ::= LBRACK column_setting (COMMA column_setting)* RBRACK {pin=1}
column_setting ::= not_null_setting | null_setting | primary_key_setting | pk_setting
                 | unique_setting | increment_setting | default_setting
                 | column_note_setting | column_inline_ref
private not_null_setting ::= NOT NULL
private null_setting ::= NULL
private primary_key_setting ::= PRIMARY KEY
private pk_setting ::= PK
private unique_setting ::= UNIQUE
private increment_setting ::= INCREMENT
private default_setting ::= DEFAULT COLON (string_literal_ | EXPRESSION | LITERAL | NUMBER)
private column_note_setting ::= NOTE COLON string_literal_
column_inline_ref ::= REF identifier_? COLON relation ref_column_names

// === Ref ===
ref_definition ::= REF ref_name? (ref_inline | ref_braced) {pin=1}
ref_name ::= identifier_
private ref_inline ::= COLON ref_body
private ref_braced ::= LBRACE nl_? ref_body nl_? RBRACE
ref_body ::= ref_column_names relation ref_column_names ref_settings?
relation ::= LT | GT | MINUS | NE
// Flattened to avoid table_name greedily consuming the column name DOT.
// Supports: table.column, schema.table.column, table.(col1, col2), schema.table.(col1, col2)
ref_column_names ::= identifier_ DOT identifier_ DOT (ref_columns_part)
                   | identifier_ DOT (ref_columns_part)
private ref_columns_part ::= identifier_ | LPAREN identifier_ (COMMA identifier_)* RPAREN
ref_settings ::= LBRACK ref_setting (COMMA ref_setting)* RBRACK {pin=1}
ref_setting ::= ref_delete_setting | ref_update_setting | ref_color_setting
private ref_delete_setting ::= DELETE COLON ref_action
private ref_update_setting ::= UPDATE COLON ref_action
private ref_color_setting ::= COLOR COLON COLOR_CODE
ref_action ::= CASCADE | RESTRICT | SET NULL | SET DEFAULT | NO ACTION

// === Enum ===
enum_definition ::= ENUM table_name LBRACE enum_body RBRACE {pin=1}
private enum_body ::= (enum_value | nl_)*
enum_value ::= identifier_ enum_value_settings? {pin=1}
enum_value_settings ::= LBRACK enum_value_setting (COMMA enum_value_setting)* RBRACK {pin=1}
private enum_value_setting ::= NOTE COLON string_literal_

// === Indexes ===
indexes_definition ::= INDEXES LBRACE indexes_body RBRACE {pin=1}
private indexes_body ::= (index_definition | nl_)*
index_definition ::= (index_composite | index_single) index_settings? {pin=1}
private index_composite ::= LPAREN index_column (COMMA index_column)* RPAREN
private index_single ::= LITERAL | EXPRESSION
index_column ::= LITERAL | EXPRESSION
index_settings ::= LBRACK (pk_index_setting | index_setting_list) RBRACK {pin=1}
private pk_index_setting ::= PK
private index_setting_list ::= index_setting (COMMA index_setting)*
index_setting ::= index_unique_setting | index_name_setting | index_type_setting | index_note_setting
private index_unique_setting ::= UNIQUE
private index_name_setting ::= NAME COLON string_literal_
private index_type_setting ::= TYPE COLON (BTREE | HASH)
private index_note_setting ::= NOTE COLON string_literal_

// === Table Group ===
table_group ::= TABLEGROUP identifier_ table_group_settings? LBRACE table_group_body RBRACE {pin=1}
table_group_settings ::= LBRACK table_group_setting (COMMA table_group_setting)* RBRACK {pin=1}
table_group_setting ::= COLOR COLON COLOR_CODE | NOTE COLON string_literal_
private table_group_body ::= (table_group_entry | table_group_note | nl_)*
table_group_entry ::= table_name
private table_group_note ::= NOTE note_value

// === Table Partial ===
table_partial ::= TABLEPARTIAL identifier_ table_settings? LBRACE table_body RBRACE {pin=1}

// === Named Note ===
named_note ::= NOTE identifier_ LBRACE string_literal_ RBRACE {pin=1}

// === Note (shared) ===
note_value ::= COLON string_literal_ | LBRACE string_literal_ RBRACE
```

**Notes for the implementer:**
- Private rules (prefixed `private`) do not generate PSI elements — they are inlined into their parent rules.
- Rules ending with `_` are also private by Grammar-Kit convention.
- `{pin=1}` means error recovery starts after matching the first token. This allows the parser to recognise a construct even if the rest is malformed.
- `{recoverWhile=...}` tells the parser what tokens to skip when recovering from an error.
- The `nl_` rule handles newlines as delimiters within bodies. Between top-level items, newlines are consumed by `item_*`.
- The NEWLINE token is significant in table bodies (between columns), enum bodies (between values), and index bodies (between entries).
- **NEWLINE handling is the trickiest part of this grammar.** Since `NEWLINE` is NOT in `getWhitespaceTokens()`, the parser does NOT auto-skip it. This means every rule where tokens can be separated by newlines needs explicit `NEWLINE` handling. The `nl_` rule covers body-level delimiters, but within rules like `column_definition`, newlines between `identifier_` and `column_datatype` are NOT automatically skipped. If this causes parse errors during testing, you have several options: (a) add `NEWLINE*` between token positions in affected rules, (b) use a `FlexAdapter` subclass that conditionally converts `NEWLINE` to `WHITE_SPACE` based on parser state, or (c) add `NEWLINE` to `getWhitespaceTokens()` and find another mechanism for line-sensitivity. Option (a) is the simplest starting point. This will require iteration during testing.
- This grammar is a starting point. You may need to tweak `recoverWhile`, `pin`, and `nl_` placement during testing to get good error recovery behaviour.

- [ ] **Step 3: Run the `generateParser` Gradle task**

Run: `./gradlew generateParser`
Expected: BUILD SUCCESSFUL, generated files appear in `src/main/gen/nz/co/steelsky/dbmlplugin/parser/DbmlParser.java` and `src/main/gen/nz/co/steelsky/dbmlplugin/psi/`.

- [ ] **Step 4: Verify the full project compiles**

Run: `./gradlew compileKotlin compileJava`
Expected: BUILD SUCCESSFUL

If there are compilation errors in generated code, fix the `.bnf` file and re-run `generateParser`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Grammar-Kit BNF grammar and PSI element type"
```

---

## Task 6: Parser Definition

**Files:**
- Create: `src/main/kotlin/nz/co/steelsky/dbmlplugin/parser/DbmlParserDefinition.kt`
- Modify: `src/main/resources/META-INF/plugin.xml`
- Test: `src/test/kotlin/nz/co/steelsky/dbmlplugin/parser/DbmlParserTest.kt`

- [ ] **Step 1: Create `DbmlParserDefinition.kt`**

```kotlin
package nz.co.steelsky.dbmlplugin.parser

import com.intellij.lang.ASTNode
import com.intellij.lang.ParserDefinition
import com.intellij.lang.PsiParser
import com.intellij.lexer.Lexer
import com.intellij.openapi.project.Project
import com.intellij.psi.FileViewProvider
import com.intellij.psi.PsiElement
import com.intellij.psi.PsiFile
import com.intellij.psi.tree.IFileElementType
import com.intellij.psi.tree.TokenSet
import nz.co.steelsky.dbmlplugin.DbmlFile
import nz.co.steelsky.dbmlplugin.DbmlLanguage
import nz.co.steelsky.dbmlplugin.lexer.DbmlLexerAdapter
import nz.co.steelsky.dbmlplugin.lexer.DbmlTokenSets
import nz.co.steelsky.dbmlplugin.psi.DbmlTypes

class DbmlParserDefinition : ParserDefinition {
    companion object {
        val FILE = IFileElementType(DbmlLanguage)
    }

    override fun createLexer(project: Project?): Lexer = DbmlLexerAdapter()
    override fun createParser(project: Project?): PsiParser = DbmlParser()
    override fun getFileNodeType(): IFileElementType = FILE
    override fun getCommentTokens(): TokenSet = DbmlTokenSets.COMMENTS
    override fun getStringLiteralElements(): TokenSet = DbmlTokenSets.STRINGS
    override fun getWhitespaceTokens(): TokenSet = DbmlTokenSets.WHITE_SPACES
    override fun createElement(node: ASTNode): PsiElement = DbmlTypes.Factory.createElement(node)
    override fun createFile(viewProvider: FileViewProvider): PsiFile = DbmlFile(viewProvider)
}
```

- [ ] **Step 2: Register parser definition in `plugin.xml`**

Add inside the `<extensions>` block:
```xml
        <lang.parserDefinition language="DBML"
                  implementationClass="nz.co.steelsky.dbmlplugin.parser.DbmlParserDefinition"/>
```

- [ ] **Step 3: Verify the build compiles**

Run: `./gradlew compileKotlin`
Expected: BUILD SUCCESSFUL

- [ ] **Step 4: Write parser test**

Create `src/test/kotlin/nz/co/steelsky/dbmlplugin/parser/DbmlParserTest.kt`:

```kotlin
package nz.co.steelsky.dbmlplugin.parser

import com.intellij.testFramework.ParsingTestCase

class DbmlParserTest : ParsingTestCase("", "dbml", DbmlParserDefinition()) {

    fun testSimpleTable() {
        doTest(true)
    }

    fun testTableWithSettings() {
        doTest(true)
    }

    fun testEnum() {
        doTest(true)
    }

    fun testRef() {
        doTest(true)
    }

    fun testProject() {
        doTest(true)
    }

    fun testIndexes() {
        doTest(true)
    }

    fun testTableGroup() {
        doTest(true)
    }

    fun testFullExample() {
        doTest(true)
    }

    fun testInvalidSyntax() {
        doTest(true)
    }

    override fun getTestDataPath(): String = "src/test/testData/parser"
    override fun skipSpaces(): Boolean = false
    override fun includeRanges(): Boolean = true
}
```

- [ ] **Step 5: Create test data files**

Create `src/test/testData/parser/SimpleTable.dbml`:
```dbml
Table users {
  id integer [pk, increment]
  name varchar(255) [not null]
  email varchar(255) [unique, not null]
  created_at timestamp [default: `now()`]
}
```

Create `src/test/testData/parser/TableWithSettings.dbml`:
```dbml
Table users as U [headercolor: #3498db] {
  id integer [pk]
  name varchar
}
```

Create `src/test/testData/parser/Enum.dbml`:
```dbml
Enum job_status {
  created [note: 'Waiting']
  running
  done
  failure
}
```

Create `src/test/testData/parser/Ref.dbml`:
```dbml
Ref: users.id < posts.user_id

Ref named_ref {
  users.id < posts.user_id [delete: cascade, update: no action]
}
```

Create `src/test/testData/parser/Project.dbml`:
```dbml
Project my_project {
  database_type: 'PostgreSQL'
  Note: 'Description here'
}
```

Create `src/test/testData/parser/Indexes.dbml`:
```dbml
Table users {
  id integer
  name varchar
  email varchar

  indexes {
    id [pk]
    (name, email) [unique, name: 'name_email_idx']
    email [type: btree]
  }
}
```

Create `src/test/testData/parser/TableGroup.dbml`:
```dbml
TableGroup ecommerce [color: #ff0000] {
  users
  orders
  products
}
```

Create `src/test/testData/parser/FullExample.dbml`:
```dbml
Project my_app {
  database_type: 'PostgreSQL'
}

Table users as U {
  id integer [pk, increment]
  name varchar(255)
  email varchar(255) [unique]

  Note: 'Stores user data'
}

Table posts {
  id integer [pk, increment]
  user_id integer [not null]
  title varchar
  body text

  indexes {
    user_id
    (user_id, title) [unique]
  }
}

Ref: posts.user_id > users.id [delete: cascade]

Enum post_status {
  draft
  published
  archived [note: 'No longer visible']
}

TableGroup blog {
  users
  posts
}
```

Create `src/test/testData/parser/InvalidSyntax.dbml`:
```dbml
Table {
  id integer [pk
  name
}
```

- [ ] **Step 6: Run the parser tests to generate expected PSI tree files**

Run: `./gradlew test --tests "nz.co.steelsky.dbmlplugin.parser.DbmlParserTest"`

The first run will fail because the expected `.txt` files don't exist yet. `ParsingTestCase` generates the actual PSI tree output. For each test:
1. Check the actual output (printed in the test failure message or found in `build/` output)
2. If the PSI tree looks correct, copy it to `src/test/testData/parser/<TestName>.txt`
3. For `InvalidSyntax.txt`, verify that it contains `PsiErrorElement` nodes

Re-run until all tests pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add parser definition with full DBML grammar and parser tests"
```

---

## Task 7: Syntax Highlighting

**Files:**
- Create: `src/main/kotlin/nz/co/steelsky/dbmlplugin/highlighting/DbmlSyntaxHighlighter.kt`
- Create: `src/main/kotlin/nz/co/steelsky/dbmlplugin/highlighting/DbmlSyntaxHighlighterFactory.kt`
- Create: `src/main/kotlin/nz/co/steelsky/dbmlplugin/highlighting/DbmlColorSettingsPage.kt`
- Modify: `src/main/resources/META-INF/plugin.xml`
- Test: `src/test/kotlin/nz/co/steelsky/dbmlplugin/highlighting/DbmlHighlightingTest.kt`

- [ ] **Step 1: Create `DbmlSyntaxHighlighter.kt`**

```kotlin
package nz.co.steelsky.dbmlplugin.highlighting

import com.intellij.lexer.Lexer
import com.intellij.openapi.editor.DefaultLanguageHighlighterColors
import com.intellij.openapi.editor.HighlighterColors
import com.intellij.openapi.editor.colors.TextAttributesKey
import com.intellij.openapi.editor.colors.TextAttributesKey.createTextAttributesKey
import com.intellij.openapi.fileTypes.SyntaxHighlighterBase
import com.intellij.psi.TokenType
import com.intellij.psi.tree.IElementType
import nz.co.steelsky.dbmlplugin.lexer.DbmlLexerAdapter
import nz.co.steelsky.dbmlplugin.lexer.DbmlTokenSets
import nz.co.steelsky.dbmlplugin.psi.DbmlTypes

class DbmlSyntaxHighlighter : SyntaxHighlighterBase() {
    companion object {
        val KEYWORD = createTextAttributesKey("DBML_KEYWORD", DefaultLanguageHighlighterColors.KEYWORD)
        val NUMBER = createTextAttributesKey("DBML_NUMBER", DefaultLanguageHighlighterColors.NUMBER)
        val STRING = createTextAttributesKey("DBML_STRING", DefaultLanguageHighlighterColors.STRING)
        val EXPRESSION = createTextAttributesKey("DBML_EXPRESSION", DefaultLanguageHighlighterColors.STRING)
        val LINE_COMMENT = createTextAttributesKey("DBML_LINE_COMMENT", DefaultLanguageHighlighterColors.LINE_COMMENT)
        val BLOCK_COMMENT = createTextAttributesKey("DBML_BLOCK_COMMENT", DefaultLanguageHighlighterColors.BLOCK_COMMENT)
        val OPERATOR = createTextAttributesKey("DBML_OPERATOR", DefaultLanguageHighlighterColors.OPERATION_SIGN)
        val BRACES = createTextAttributesKey("DBML_BRACES", DefaultLanguageHighlighterColors.BRACES)
        val BRACKETS = createTextAttributesKey("DBML_BRACKETS", DefaultLanguageHighlighterColors.BRACKETS)
        val PARENTHESES = createTextAttributesKey("DBML_PARENTHESES", DefaultLanguageHighlighterColors.PARENTHESES)
        val COLOR_CODE = createTextAttributesKey("DBML_COLOR_CODE", DefaultLanguageHighlighterColors.STRING)
        val BAD_CHARACTER = createTextAttributesKey("DBML_BAD_CHARACTER", HighlighterColors.BAD_CHARACTER)

        private val KEYWORD_KEYS = arrayOf(KEYWORD)
        private val NUMBER_KEYS = arrayOf(NUMBER)
        private val STRING_KEYS = arrayOf(STRING)
        private val EXPRESSION_KEYS = arrayOf(EXPRESSION)
        private val LINE_COMMENT_KEYS = arrayOf(LINE_COMMENT)
        private val BLOCK_COMMENT_KEYS = arrayOf(BLOCK_COMMENT)
        private val OPERATOR_KEYS = arrayOf(OPERATOR)
        private val BRACES_KEYS = arrayOf(BRACES)
        private val BRACKETS_KEYS = arrayOf(BRACKETS)
        private val PARENTHESES_KEYS = arrayOf(PARENTHESES)
        private val COLOR_CODE_KEYS = arrayOf(COLOR_CODE)
        private val BAD_CHARACTER_KEYS = arrayOf(BAD_CHARACTER)
        private val EMPTY_KEYS = emptyArray<TextAttributesKey>()
    }

    override fun getHighlightingLexer(): Lexer = DbmlLexerAdapter()

    override fun getTokenHighlights(tokenType: IElementType): Array<TextAttributesKey> {
        return when {
            DbmlTokenSets.KEYWORDS.contains(tokenType) -> KEYWORD_KEYS
            tokenType == DbmlTypes.NUMBER -> NUMBER_KEYS
            DbmlTokenSets.STRINGS.contains(tokenType) -> STRING_KEYS
            tokenType == DbmlTypes.EXPRESSION -> EXPRESSION_KEYS
            tokenType == DbmlTypes.LINE_COMMENT -> LINE_COMMENT_KEYS
            tokenType == DbmlTypes.BLOCK_COMMENT -> BLOCK_COMMENT_KEYS
            tokenType == DbmlTypes.COLOR_CODE -> COLOR_CODE_KEYS
            tokenType == DbmlTypes.LBRACE || tokenType == DbmlTypes.RBRACE -> BRACES_KEYS
            tokenType == DbmlTypes.LBRACK || tokenType == DbmlTypes.RBRACK -> BRACKETS_KEYS
            tokenType == DbmlTypes.LPAREN || tokenType == DbmlTypes.RPAREN -> PARENTHESES_KEYS
            tokenType == DbmlTypes.MINUS || tokenType == DbmlTypes.LT
                || tokenType == DbmlTypes.GT || tokenType == DbmlTypes.NE
                || tokenType == DbmlTypes.COLON || tokenType == DbmlTypes.COMMA
                || tokenType == DbmlTypes.DOT || tokenType == DbmlTypes.TILDE -> OPERATOR_KEYS
            tokenType == TokenType.BAD_CHARACTER -> BAD_CHARACTER_KEYS
            else -> EMPTY_KEYS
        }
    }
}
```

- [ ] **Step 2: Create `DbmlSyntaxHighlighterFactory.kt`**

```kotlin
package nz.co.steelsky.dbmlplugin.highlighting

import com.intellij.openapi.fileTypes.SyntaxHighlighter
import com.intellij.openapi.fileTypes.SyntaxHighlighterFactory
import com.intellij.openapi.project.Project
import com.intellij.openapi.vfs.VirtualFile

class DbmlSyntaxHighlighterFactory : SyntaxHighlighterFactory() {
    override fun getSyntaxHighlighter(project: Project?, virtualFile: VirtualFile?): SyntaxHighlighter {
        return DbmlSyntaxHighlighter()
    }
}
```

- [ ] **Step 3: Create `DbmlColorSettingsPage.kt`**

```kotlin
package nz.co.steelsky.dbmlplugin.highlighting

import com.intellij.openapi.editor.colors.TextAttributesKey
import com.intellij.openapi.fileTypes.SyntaxHighlighter
import com.intellij.openapi.options.colors.AttributesDescriptor
import com.intellij.openapi.options.colors.ColorDescriptor
import com.intellij.openapi.options.colors.ColorSettingsPage
import nz.co.steelsky.dbmlplugin.DbmlIcons
import javax.swing.Icon

class DbmlColorSettingsPage : ColorSettingsPage {
    companion object {
        private val DESCRIPTORS = arrayOf(
            AttributesDescriptor("Keyword", DbmlSyntaxHighlighter.KEYWORD),
            AttributesDescriptor("Number", DbmlSyntaxHighlighter.NUMBER),
            AttributesDescriptor("String", DbmlSyntaxHighlighter.STRING),
            AttributesDescriptor("Expression", DbmlSyntaxHighlighter.EXPRESSION),
            AttributesDescriptor("Line comment", DbmlSyntaxHighlighter.LINE_COMMENT),
            AttributesDescriptor("Block comment", DbmlSyntaxHighlighter.BLOCK_COMMENT),
            AttributesDescriptor("Operator", DbmlSyntaxHighlighter.OPERATOR),
            AttributesDescriptor("Braces", DbmlSyntaxHighlighter.BRACES),
            AttributesDescriptor("Brackets", DbmlSyntaxHighlighter.BRACKETS),
            AttributesDescriptor("Parentheses", DbmlSyntaxHighlighter.PARENTHESES),
            AttributesDescriptor("Colour code", DbmlSyntaxHighlighter.COLOR_CODE),
        )
    }

    override fun getIcon(): Icon = DbmlIcons.FILE
    override fun getHighlighter(): SyntaxHighlighter = DbmlSyntaxHighlighter()
    override fun getDemoText(): String = """
// DBML sample
/* Block comment */
Project my_app {
  database_type: 'PostgreSQL'
}

Table users as U [headercolor: #3498db] {
  id integer [pk, increment]
  name varchar(255) [not null]
  email varchar [unique, default: `gen_random_uuid()`]

  indexes {
    email [type: btree]
    (name, email) [unique, name: 'idx_name_email']
  }

  Note: 'Stores user accounts'
}

Ref: users.id < posts.user_id [delete: cascade]

Enum status {
  active
  inactive [note: 'Disabled']
}

TableGroup core {
  users
  posts
}
""".trimIndent()

    override fun getAdditionalHighlightingTagToDescriptorMap(): Map<String, TextAttributesKey>? = null
    override fun getAttributeDescriptors(): Array<AttributesDescriptor> = DESCRIPTORS
    override fun getColorDescriptors(): Array<ColorDescriptor> = ColorDescriptor.EMPTY_ARRAY
    override fun getDisplayName(): String = "DBML"
}
```

- [ ] **Step 4: Register in `plugin.xml`**

Add inside the `<extensions>` block:
```xml
        <lang.syntaxHighlighterFactory language="DBML"
                  implementationClass="nz.co.steelsky.dbmlplugin.highlighting.DbmlSyntaxHighlighterFactory"/>
        <colorSettingsPage implementation="nz.co.steelsky.dbmlplugin.highlighting.DbmlColorSettingsPage"/>
```

- [ ] **Step 5: Verify the build compiles**

Run: `./gradlew compileKotlin`
Expected: BUILD SUCCESSFUL

- [ ] **Step 6: Write highlighting test**

Create `src/test/kotlin/nz/co/steelsky/dbmlplugin/highlighting/DbmlHighlightingTest.kt`:

```kotlin
package nz.co.steelsky.dbmlplugin.highlighting

import com.intellij.openapi.editor.colors.TextAttributesKey
import com.intellij.psi.tree.IElementType
import com.intellij.testFramework.fixtures.BasePlatformTestCase
import nz.co.steelsky.dbmlplugin.psi.DbmlTypes

class DbmlHighlightingTest : BasePlatformTestCase() {
    private val highlighter = DbmlSyntaxHighlighter()

    fun testKeywordsHighlighted() {
        val keywordTokens = listOf(
            DbmlTypes.TABLE, DbmlTypes.PROJECT, DbmlTypes.REF,
            DbmlTypes.ENUM, DbmlTypes.NOTE, DbmlTypes.INDEXES,
        )
        for (token in keywordTokens) {
            val keys = highlighter.getTokenHighlights(token)
            assertTrue("Expected KEYWORD highlighting for $token", keys.contains(DbmlSyntaxHighlighter.KEYWORD))
        }
    }

    fun testStringHighlighted() {
        val stringTokens = listOf(
            DbmlTypes.SINGLE_QUOTED_STRING,
            DbmlTypes.DOUBLE_QUOTED_STRING,
            DbmlTypes.TRIPLE_QUOTED_STRING,
        )
        for (token in stringTokens) {
            val keys = highlighter.getTokenHighlights(token)
            assertTrue("Expected STRING highlighting for $token", keys.contains(DbmlSyntaxHighlighter.STRING))
        }
    }

    fun testCommentHighlighted() {
        assertHighlightContains(DbmlTypes.LINE_COMMENT, DbmlSyntaxHighlighter.LINE_COMMENT)
        assertHighlightContains(DbmlTypes.BLOCK_COMMENT, DbmlSyntaxHighlighter.BLOCK_COMMENT)
    }

    fun testNumberHighlighted() {
        assertHighlightContains(DbmlTypes.NUMBER, DbmlSyntaxHighlighter.NUMBER)
    }

    fun testOperatorHighlighted() {
        val operatorTokens = listOf(
            DbmlTypes.LT, DbmlTypes.GT, DbmlTypes.MINUS,
            DbmlTypes.NE, DbmlTypes.COLON, DbmlTypes.DOT,
        )
        for (token in operatorTokens) {
            assertHighlightContains(token, DbmlSyntaxHighlighter.OPERATOR)
        }
    }

    fun testBracesHighlighted() {
        assertHighlightContains(DbmlTypes.LBRACE, DbmlSyntaxHighlighter.BRACES)
        assertHighlightContains(DbmlTypes.RBRACE, DbmlSyntaxHighlighter.BRACES)
    }

    private fun assertHighlightContains(token: IElementType, expected: TextAttributesKey) {
        val keys = highlighter.getTokenHighlights(token)
        assertTrue("Expected ${expected.externalName} highlighting for $token", keys.contains(expected))
    }
}
```

- [ ] **Step 7: Run the highlighting tests**

Run: `./gradlew test --tests "nz.co.steelsky.dbmlplugin.highlighting.DbmlHighlightingTest"`
Expected: All tests pass.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add syntax highlighting with colour settings page"
```

---

## Task 8: Brace Matching & Commenter

**Files:**
- Create: `src/main/kotlin/nz/co/steelsky/dbmlplugin/DbmlBraceMatcher.kt`
- Create: `src/main/kotlin/nz/co/steelsky/dbmlplugin/DbmlCommenter.kt`
- Modify: `src/main/resources/META-INF/plugin.xml`

- [ ] **Step 1: Create `DbmlBraceMatcher.kt`**

```kotlin
package nz.co.steelsky.dbmlplugin

import com.intellij.lang.BracePair
import com.intellij.lang.PairedBraceMatcher
import com.intellij.psi.PsiFile
import com.intellij.psi.tree.IElementType
import nz.co.steelsky.dbmlplugin.psi.DbmlTypes

class DbmlBraceMatcher : PairedBraceMatcher {
    companion object {
        private val PAIRS = arrayOf(
            BracePair(DbmlTypes.LBRACE, DbmlTypes.RBRACE, true),
            BracePair(DbmlTypes.LBRACK, DbmlTypes.RBRACK, false),
            BracePair(DbmlTypes.LPAREN, DbmlTypes.RPAREN, false),
        )
    }

    override fun getPairs(): Array<BracePair> = PAIRS
    override fun isPairedBracesAllowedBeforeType(lbraceType: IElementType, contextType: IElementType?): Boolean = true
    override fun getCodeConstructStart(file: PsiFile?, openingBraceOffset: Int): Int = openingBraceOffset
}
```

- [ ] **Step 2: Create `DbmlCommenter.kt`**

```kotlin
package nz.co.steelsky.dbmlplugin

import com.intellij.lang.Commenter

class DbmlCommenter : Commenter {
    override fun getLineCommentPrefix(): String = "//"
    override fun getBlockCommentPrefix(): String = "/*"
    override fun getBlockCommentSuffix(): String = "*/"
    override fun getCommentedBlockCommentPrefix(): String? = null
    override fun getCommentedBlockCommentSuffix(): String? = null
}
```

- [ ] **Step 3: Register in `plugin.xml`**

Add inside the `<extensions>` block:
```xml
        <lang.braceMatcher language="DBML"
                  implementationClass="nz.co.steelsky.dbmlplugin.DbmlBraceMatcher"/>
        <lang.commenter language="DBML"
                  implementationClass="nz.co.steelsky.dbmlplugin.DbmlCommenter"/>
```

- [ ] **Step 4: Verify the build compiles**

Run: `./gradlew compileKotlin`
Expected: BUILD SUCCESSFUL

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add brace matching and comment toggling"
```

---

## Task 9: Integration Test & Manual Verification

**Files:**
- No new files — verification of existing work

- [ ] **Step 1: Run the full test suite**

Run: `./gradlew check`
Expected: BUILD SUCCESSFUL, all tests pass.

- [ ] **Step 2: Run the plugin in a sandboxed IDE**

Run: `./gradlew runIde`

In the sandboxed IDE:
1. Create a new file called `test.dbml`
2. Verify the file icon appears (database cylinder)
3. Paste this sample and verify highlighting:

```dbml
// User management schema
Project my_app {
  database_type: 'PostgreSQL'
}

Table users as U [headercolor: #3498db] {
  id integer [pk, increment]
  name varchar(255) [not null]
  email varchar [unique, default: `gen_random_uuid()`]

  indexes {
    email [type: btree]
    (name, email) [unique, name: 'idx_name_email']
  }

  Note: 'Stores user accounts'
}

Ref: users.id < posts.user_id [delete: cascade]

Enum status {
  active
  inactive [note: 'Disabled']
}

TableGroup core {
  users
  posts
}
```

4. Verify: keywords are bold/coloured, strings have string colour, comments are italic, operators are distinct, braces highlight when cursor is on them
5. Test Cmd+/ toggles line comments
6. Type invalid syntax (e.g. `Table {`) and verify red error highlighting appears
7. Go to Settings > Editor > Color Scheme > DBML and verify the colour settings page works

- [ ] **Step 3: Run plugin verification**

Run: `./gradlew verifyPlugin`
Expected: BUILD SUCCESSFUL, no compatibility issues.

- [ ] **Step 4: Commit any fixes from testing**

```bash
git add -A
git commit -m "fix: address issues found during integration testing"
```

(Only if there were issues to fix. Skip if everything passed.)

- [ ] **Step 5: Final build**

Run: `./gradlew buildPlugin`
Expected: BUILD SUCCESSFUL, plugin zip created in `build/distributions/`.

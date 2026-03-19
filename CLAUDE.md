# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IntelliJ Platform plugin for DBML (Database Markup Language) support. Built from the JetBrains IntelliJ Platform Plugin Template.

## Build Commands

```bash
# Build the plugin
./gradlew buildPlugin

# Run tests
./gradlew check

# Run a specific test class
./gradlew test --tests "nz.co.steelsky.dbmlplugin.MyPluginTest"

# Run a specific test method
./gradlew test --tests "nz.co.steelsky.dbmlplugin.MyPluginTest.testXMLFile"

# Verify plugin compatibility
./gradlew verifyPlugin

# Run the plugin in a sandboxed IDE instance
./gradlew runIde

# Run IDE for UI tests
./gradlew runIdeForUiTests
```

## Architecture

- **Build system**: Gradle (Kotlin DSL) with IntelliJ Platform Gradle Plugin v2
- **Language**: Kotlin, JVM toolchain 21
- **Target IDE**: IntelliJ IDEA 2025.2+ (sinceBuild = 252)
- **Dependencies managed via**: Gradle version catalog (`gradle/libs.versions.toml`)

### Source Layout

- `src/main/kotlin/nz/co/steelsky/dbmlplugin/` — plugin source
- `src/main/gen/` — generated lexer/parser source (Grammar-Kit output, gitignored)
- `src/main/resources/META-INF/plugin.xml` — plugin configuration (extensions, services, actions registration)
- `src/test/kotlin/` — tests using `BasePlatformTestCase` (IntelliJ test framework)
- `src/test/testData/` — test fixture data

### Key Conventions

- Plugin extensions are registered in `plugin.xml`, not via annotations
- Tests extend `BasePlatformTestCase` and use `myFixture` for PSI/editor testing
- Plugin description is extracted from `README.md` between `<!-- Plugin description -->` markers during build — do not remove those markers
- Version and build properties are centralized in `gradle.properties`
- Lexer source: `src/main/kotlin/nz/co/steelsky/dbmlplugin/lexer/Dbml.flex`
- Parser source: `src/main/kotlin/nz/co/steelsky/dbmlplugin/parser/Dbml.bnf`

## CI/CD

GitHub Actions workflows in `.github/workflows/`:
- **build.yml**: Build, test, Qodana inspection, plugin verification, and draft release (on main push)
- **release.yml**: Publish to JetBrains Marketplace (triggered by GitHub release publish)
- **run-ui-tests.yml**: UI test runner

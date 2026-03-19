package nz.co.steelsky.dbmlplugin.lexer

import com.intellij.lexer.FlexAdapter

class DbmlLexerAdapter : FlexAdapter(DbmlLexer(null))

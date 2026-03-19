package nz.co.steelsky.dbmlplugin.lexer

import com.intellij.psi.tree.IElementType
import nz.co.steelsky.dbmlplugin.DbmlLanguage

class DbmlTokenType(debugName: String) : IElementType(debugName, DbmlLanguage)

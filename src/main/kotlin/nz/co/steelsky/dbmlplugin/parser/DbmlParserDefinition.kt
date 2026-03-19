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

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

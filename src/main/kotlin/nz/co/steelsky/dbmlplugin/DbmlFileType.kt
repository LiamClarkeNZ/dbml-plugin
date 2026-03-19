package nz.co.steelsky.dbmlplugin

import com.intellij.openapi.fileTypes.LanguageFileType
import javax.swing.Icon

object DbmlFileType : LanguageFileType(DbmlLanguage) {
    override fun getName(): String = "DBML"
    override fun getDescription(): String = "Database Markup Language"
    override fun getDefaultExtension(): String = "dbml"
    override fun getIcon(): Icon = DbmlIcons.FILE
}

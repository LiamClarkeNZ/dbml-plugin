package nz.co.steelsky.dbmlplugin

import com.intellij.extapi.psi.PsiFileBase
import com.intellij.openapi.fileTypes.FileType
import com.intellij.psi.FileViewProvider

class DbmlFile(viewProvider: FileViewProvider) : PsiFileBase(viewProvider, DbmlLanguage) {
    override fun getFileType(): FileType = DbmlFileType
    override fun toString(): String = "DBML File"
}

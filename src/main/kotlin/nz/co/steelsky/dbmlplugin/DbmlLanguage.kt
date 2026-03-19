package nz.co.steelsky.dbmlplugin

import com.intellij.lang.Language

object DbmlLanguage : Language("DBML") {
    private fun readResolve(): Any = DbmlLanguage
}

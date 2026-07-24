package nz.co.steelsky.dbmlplugin.preview

import com.google.gson.JsonParser
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.editor.colors.EditorColorsListener
import com.intellij.openapi.editor.colors.EditorColorsManager
import com.intellij.openapi.editor.event.DocumentEvent
import com.intellij.openapi.editor.event.DocumentListener
import com.intellij.openapi.fileEditor.FileDocumentManager
import com.intellij.openapi.fileEditor.FileEditor
import com.intellij.openapi.fileEditor.FileEditorState
import com.intellij.openapi.fileEditor.OpenFileDescriptor
import com.intellij.openapi.project.Project
import com.intellij.openapi.util.Disposer
import com.intellij.openapi.util.UserDataHolderBase
import com.intellij.openapi.vfs.VirtualFile
import com.intellij.psi.PsiDocumentManager
import com.intellij.ui.jcef.JBCefApp
import com.intellij.ui.jcef.JBCefBrowser
import com.intellij.ui.jcef.JBCefBrowserBase
import com.intellij.ui.jcef.JBCefJSQuery
import com.intellij.util.Alarm
import nz.co.steelsky.dbmlplugin.model.SchemaExtractor
import nz.co.steelsky.dbmlplugin.model.structuralHash
import nz.co.steelsky.dbmlplugin.model.toJson
import java.beans.PropertyChangeListener
import javax.swing.JComponent
import javax.swing.JLabel

class DbmlPreviewFileEditor(
    private val project: Project,
    private val file: VirtualFile,
) : UserDataHolderBase(), FileEditor {

    private val browser: JBCefBrowser? = if (JBCefApp.isSupported()) JBCefBrowser() else null
    private val fallback = JLabel("DBML preview requires JCEF, which is not available in this IDE.")
    private val alarm = Alarm(Alarm.ThreadToUse.SWING_THREAD, this)
    private val document = FileDocumentManager.getInstance().getDocument(file)

    init {
        val b = browser
        if (b != null) {
            Disposer.register(this, b)

            val navQuery = JBCefJSQuery.create(b as JBCefBrowserBase)
            navQuery.addHandler { payload ->
                handleNavigate(payload)
                null
            }
            val readyQuery = JBCefJSQuery.create(b)
            readyQuery.addHandler {
                pushRender()
                pushTheme()
                null
            }

            b.loadHTML(WebviewHtml.load())
            b.cefBrowser.executeJavaScript(
                "window.__onNavigate = (p) => { ${navQuery.inject("JSON.stringify(p)")} };" +
                    "window.addEventListener('dbml-webview-ready', () => { ${readyQuery.inject("'ready'")} });",
                b.cefBrowser.url,
                0,
            )

            document?.addDocumentListener(
                object : DocumentListener {
                    override fun documentChanged(event: DocumentEvent) {
                        alarm.cancelAllRequests()
                        alarm.addRequest({ pushRender() }, DEBOUNCE_MS)
                    }
                },
                this,
            )

            val connection = project.messageBus.connect(this)
            connection.subscribe(
                EditorColorsManager.TOPIC,
                EditorColorsListener { pushTheme() },
            )
        }
    }

    private fun pushRender() {
        val b = browser ?: return
        val doc = document ?: return
        val psiManager = PsiDocumentManager.getInstance(project)
        psiManager.commitDocument(doc)
        val psiFile = psiManager.getPsiFile(doc) ?: return
        val model = SchemaExtractor.extract(psiFile)
        b.cefBrowser.executeJavaScript(
            RenderBridge.renderCall(model.toJson(), model.structuralHash()),
            b.cefBrowser.url,
            0,
        )
    }

    private fun pushTheme() {
        val b = browser ?: return
        b.cefBrowser.executeJavaScript(
            RenderBridge.applyThemeCall(ThemeVars.currentThemeVars()),
            b.cefBrowser.url,
            0,
        )
    }

    private fun handleNavigate(payload: String) {
        val offset = runCatching {
            JsonParser.parseString(payload).asJsonObject.get("offset").asInt
        }.getOrNull() ?: return
        ApplicationManager.getApplication().invokeLater {
            OpenFileDescriptor(project, file, offset).navigate(true)
        }
    }

    override fun getComponent(): JComponent = browser?.component ?: fallback
    override fun getPreferredFocusedComponent(): JComponent? = browser?.component
    override fun getName(): String = "DBML Preview"
    override fun setState(state: FileEditorState) {}
    override fun isModified(): Boolean = false
    override fun isValid(): Boolean = true
    override fun addPropertyChangeListener(listener: PropertyChangeListener) {}
    override fun removePropertyChangeListener(listener: PropertyChangeListener) {}
    override fun getFile(): VirtualFile = file
    override fun dispose() {}

    private companion object {
        const val DEBOUNCE_MS = 250
    }
}

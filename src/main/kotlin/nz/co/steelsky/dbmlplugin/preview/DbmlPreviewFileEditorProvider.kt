package nz.co.steelsky.dbmlplugin.preview

import com.intellij.openapi.fileEditor.FileEditor
import com.intellij.openapi.fileEditor.FileEditorPolicy
import com.intellij.openapi.fileEditor.FileEditorProvider
import com.intellij.openapi.fileEditor.TextEditor
import com.intellij.openapi.fileEditor.TextEditorWithPreview
import com.intellij.openapi.fileEditor.impl.text.TextEditorProvider
import com.intellij.openapi.project.DumbAware
import com.intellij.openapi.project.Project
import com.intellij.openapi.vfs.VirtualFile
import nz.co.steelsky.dbmlplugin.DbmlFileType

class DbmlPreviewFileEditorProvider : FileEditorProvider, DumbAware {

    override fun accept(project: Project, file: VirtualFile): Boolean =
        file.fileType == DbmlFileType

    override fun createEditor(project: Project, file: VirtualFile): FileEditor {
        val textEditor = TextEditorProvider.getInstance().createEditor(project, file) as TextEditor
        val preview = DbmlPreviewFileEditor(project, file)
        return TextEditorWithPreview(
            textEditor,
            preview,
            "DBML Preview",
            TextEditorWithPreview.Layout.SHOW_EDITOR_AND_PREVIEW,
        )
    }

    override fun getEditorTypeId(): String = "dbml-preview"

    override fun getPolicy(): FileEditorPolicy = FileEditorPolicy.HIDE_DEFAULT_EDITOR
}

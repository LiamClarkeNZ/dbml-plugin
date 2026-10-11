package nz.co.steelsky.dbmlplugin.model

import com.google.gson.Gson

private val GSON: Gson = Gson()

/** Serialises the schema to the JSON contract consumed by the visualisation webview. */
fun SchemaModel.toJson(): String = GSON.toJson(this)

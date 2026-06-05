package expo.modules.datadetector

import com.google.mlkit.common.model.RemoteModelManager
import com.google.mlkit.nl.entityextraction.Entity
import com.google.mlkit.nl.entityextraction.EntityExtraction
import com.google.mlkit.nl.entityextraction.EntityExtractionParams
import com.google.mlkit.nl.entityextraction.EntityExtractionRemoteModel
import com.google.mlkit.nl.entityextraction.EntityExtractorOptions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

class ReactNativeDataDetectorModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ReactNativeDataDetector")

    AsyncFunction("prepareModel") { language: String, promise: Promise ->
      val options = EntityExtractorOptions.Builder(modelIdentifierFor(language)).build()
      val extractor = EntityExtraction.getClient(options)

      extractor.downloadModelIfNeeded()
        .addOnSuccessListener {
          promise.resolve(true)
          extractor.close()
        }
        .addOnFailureListener { e ->
          promise.reject("MODEL_DOWNLOAD_ERROR", e.message ?: "Failed to download ML Kit model", e)
          extractor.close()
        }
    }

    AsyncFunction("getModelStatus") { language: String, promise: Promise ->
      val model = EntityExtractionRemoteModel.Builder(modelIdentifierFor(language)).build()

      RemoteModelManager.getInstance().isModelDownloaded(model)
        .addOnSuccessListener { downloaded ->
          promise.resolve(if (downloaded) "ready" else "notDownloaded")
        }
        .addOnFailureListener { e ->
          promise.reject("MODEL_STATUS_ERROR", e.message ?: "Failed to read ML Kit model status", e)
        }
    }

    AsyncFunction("detect") { text: String, types: List<String>, language: String, promise: Promise ->
      val options = EntityExtractorOptions.Builder(modelIdentifierFor(language)).build()
      val extractor = EntityExtraction.getClient(options)

      extractor.downloadModelIfNeeded()
        .addOnSuccessListener {
          val params = EntityExtractionParams.Builder(text).build()

          extractor.annotate(params)
            .addOnSuccessListener { annotations ->
              val results = mutableListOf<Map<String, Any>>()

              for (annotation in annotations) {
                for (entity in annotation.entities) {
                  val type = mapEntityType(entity) ?: continue
                  if (!types.contains(type)) continue

                  val data = mutableMapOf<String, String>()
                  populateEntityData(entity, type, data, annotation.annotatedText)

                  results.add(
                    mapOf(
                      "type" to type,
                      "text" to annotation.annotatedText,
                      "start" to annotation.start,
                      "end" to annotation.end,
                      "data" to data
                    )
                  )
                  break // One result per annotation
                }
              }

              promise.resolve(results)
              extractor.close()
            }
            .addOnFailureListener { e ->
              promise.reject("DETECTION_ERROR", e.message ?: "Entity extraction failed", e)
              extractor.close()
            }
        }
        .addOnFailureListener { e ->
          promise.reject("MODEL_DOWNLOAD_ERROR", e.message ?: "Failed to download ML Kit model", e)
          extractor.close()
        }
    }
  }

  /**
   * Maps an ISO 639-1 language code from JavaScript to its ML Kit
   * [EntityExtractorOptions] model identifier. Falls back to English for
   * unknown codes so detection still works.
   */
  private fun modelIdentifierFor(language: String): String {
    return when (language) {
      "ar" -> EntityExtractorOptions.ARABIC
      "nl" -> EntityExtractorOptions.DUTCH
      "en" -> EntityExtractorOptions.ENGLISH
      "fr" -> EntityExtractorOptions.FRENCH
      "de" -> EntityExtractorOptions.GERMAN
      "it" -> EntityExtractorOptions.ITALIAN
      "ja" -> EntityExtractorOptions.JAPANESE
      "ko" -> EntityExtractorOptions.KOREAN
      "pl" -> EntityExtractorOptions.POLISH
      "pt" -> EntityExtractorOptions.PORTUGUESE
      "ru" -> EntityExtractorOptions.RUSSIAN
      "es" -> EntityExtractorOptions.SPANISH
      "th" -> EntityExtractorOptions.THAI
      "tr" -> EntityExtractorOptions.TURKISH
      "zh" -> EntityExtractorOptions.CHINESE
      else -> EntityExtractorOptions.ENGLISH
    }
  }

  private fun mapEntityType(entity: Entity): String? {
    return when (entity.type) {
      Entity.TYPE_PHONE -> "phoneNumber"
      Entity.TYPE_URL -> "link"
      Entity.TYPE_EMAIL -> "email"
      Entity.TYPE_ADDRESS -> "address"
      Entity.TYPE_DATE_TIME -> "date"
      else -> null
    }
  }

  private fun populateEntityData(
    entity: Entity,
    type: String,
    data: MutableMap<String, String>,
    annotatedText: String
  ) {
    when (type) {
      "phoneNumber" -> data["phoneNumber"] = annotatedText
      "link" -> data["url"] = annotatedText
      "email" -> data["email"] = annotatedText
      "address" -> data["address"] = annotatedText
      "date" -> {
        entity.asDateTimeEntity()?.let { dateTime ->
          val formatter = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US)
          formatter.timeZone = TimeZone.getTimeZone("UTC")
          data["date"] = formatter.format(Date(dateTime.timestampMillis))
        }
      }
    }
  }
}

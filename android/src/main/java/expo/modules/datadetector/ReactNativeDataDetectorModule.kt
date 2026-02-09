package expo.modules.datadetector

import com.google.mlkit.nl.entityextraction.Entity
import com.google.mlkit.nl.entityextraction.EntityExtraction
import com.google.mlkit.nl.entityextraction.EntityExtractionParams
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

    AsyncFunction("downloadModel") { promise: Promise ->
      val options = EntityExtractorOptions.Builder(EntityExtractorOptions.ENGLISH)
        .build()
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

    AsyncFunction("detect") { text: String, types: List<String>, promise: Promise ->
      val options = EntityExtractorOptions.Builder(EntityExtractorOptions.ENGLISH)
        .build()
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

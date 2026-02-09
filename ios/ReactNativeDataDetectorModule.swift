import ExpoModulesCore
import Foundation

public class ReactNativeDataDetectorModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ReactNativeDataDetector")

    // No-op on iOS — NSDataDetector requires no model download
    AsyncFunction("downloadModel") { () -> Bool in
      return true
    }

    AsyncFunction("detect") { (text: String, types: [String]) -> [[String: Any]] in
      var checkingTypes: NSTextCheckingResult.CheckingType = []

      for type in types {
        switch type {
        case "phoneNumber":
          checkingTypes.insert(.phoneNumber)
        case "link", "email":
          checkingTypes.insert(.link)
        case "address":
          checkingTypes.insert(.address)
        case "date":
          checkingTypes.insert(.date)
        default:
          break
        }
      }

      guard let detector = try? NSDataDetector(types: checkingTypes.rawValue) else {
        return []
      }

      let range = NSRange(text.startIndex..., in: text)
      let matches = detector.matches(in: text, options: [], range: range)

      var results: [[String: Any]] = []

      for match in matches {
        guard let matchRange = Range(match.range, in: text) else { continue }
        let matchedText = String(text[matchRange])

        var type: String
        var data: [String: String] = [:]

        switch match.resultType {
        case .phoneNumber:
          guard types.contains("phoneNumber") else { continue }
          type = "phoneNumber"
          if let phone = match.phoneNumber {
            data["phoneNumber"] = phone
          }

        case .link:
          guard let url = match.url else { continue }
          if url.scheme == "mailto" {
            guard types.contains("email") else { continue }
            type = "email"
            data["email"] = url.absoluteString.replacingOccurrences(of: "mailto:", with: "")
          } else {
            guard types.contains("link") else { continue }
            type = "link"
            data["url"] = url.absoluteString
          }

        case .address:
          guard types.contains("address") else { continue }
          type = "address"
          if let components = match.addressComponents {
            if let street = components[.street] { data["street"] = street }
            if let city = components[.city] { data["city"] = city }
            if let state = components[.state] { data["state"] = state }
            if let zip = components[.zip] { data["zip"] = zip }
            if let country = components[.country] { data["country"] = country }
          }

        case .date:
          guard types.contains("date") else { continue }
          type = "date"
          if let date = match.date {
            let formatter = ISO8601DateFormatter()
            data["date"] = formatter.string(from: date)
          }

        default:
          continue
        }

        let start = text.distance(from: text.startIndex, to: matchRange.lowerBound)
        let end = text.distance(from: text.startIndex, to: matchRange.upperBound)

        results.append([
          "type": type,
          "text": matchedText,
          "start": start,
          "end": end,
          "data": data,
        ])
      }

      return results
    }
  }
}

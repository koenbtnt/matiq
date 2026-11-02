import ExpoModulesCore
import Foundation

private final class InvalidFileUriException: Exception, @unchecked Sendable {
  override var reason: String { "Not a file:// URI" }
}

private func fileUrl(_ uri: String) throws -> URL {
  guard let url = URL(string: uri), url.isFileURL else { throw InvalidFileUriException() }
  return url
}

public final class MatiqBackupModule: Module {
  public func definition() -> ModuleDefinition {
    Name("MatiqBackup")

    // Sets the flag, then re-reads it so the caller learns what the file system actually holds.
    Function("setExcludedFromBackup") { (uri: String, excluded: Bool) throws -> Bool in
      var url = try fileUrl(uri)
      var values = URLResourceValues()
      values.isExcludedFromBackup = excluded
      try url.setResourceValues(values)
      return try url.resourceValues(forKeys: [.isExcludedFromBackupKey]).isExcludedFromBackup ?? false
    }

    Function("isExcludedFromBackup") { (uri: String) throws -> Bool in
      let url = try fileUrl(uri)
      return try url.resourceValues(forKeys: [.isExcludedFromBackupKey]).isExcludedFromBackup ?? false
    }
  }
}

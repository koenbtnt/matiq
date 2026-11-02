Pod::Spec.new do |s|
  s.name           = 'MatiqBackup'
  s.version        = '0.1.0'
  s.summary        = 'Excludes files and directories from iCloud and iTunes backups.'
  s.description    = 'Sets URLResourceValues.isExcludedFromBackup on file URLs (matIQ CO-28, R-39).'
  s.license        = 'UNLICENSED'
  s.author         = 'matIQ'
  s.homepage       = 'https://github.com/matiq'
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/matiq/matiq.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = "**/*.{h,m,swift}"
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end

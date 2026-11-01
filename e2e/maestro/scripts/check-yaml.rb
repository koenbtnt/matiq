# Static check: every flow/subflow parses as a two-document Maestro YAML (config + commands list).
# Usage: ruby e2e/maestro/scripts/check-yaml.rb
require 'yaml'
bad = 0
Dir[File.join(__dir__, '..', '{flows,subflows}', '**', '*.yaml')].sort.each do |f|
  docs = YAML.load_stream(File.read(f))
  ok = docs.length == 2 && docs[0].is_a?(Hash) && docs[0]['appId'] == 'nl.btnt.matiq' && docs[1].is_a?(Array)
  puts "#{ok ? 'ok  ' : 'BAD '} #{File.basename(f)}"
  bad += 1 unless ok
rescue StandardError => e
  puts "BAD  #{File.basename(f)}: #{e.message}"
  bad += 1
end
exit(bad.zero? ? 0 : 1)

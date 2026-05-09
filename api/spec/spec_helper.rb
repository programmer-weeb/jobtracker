require "simplecov"

SimpleCov.start "rails" do
  add_filter "/spec/"
  minimum_coverage 85
end

RSpec.configure do |config|
  config.example_status_persistence_file_path = ".rspec_status"
  config.disable_monkey_patching!
  config.expect_with :rspec do |c|
    c.syntax = :expect
  end
end

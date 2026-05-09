RSpec.configure do |config|
  config.before(:each, :rack_attack) do
    Rack::Attack.cache.store.clear
  end
end

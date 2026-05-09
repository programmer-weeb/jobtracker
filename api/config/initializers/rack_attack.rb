Rack::Attack.cache.store = if ENV["REDIS_URL"].present?
  ActiveSupport::Cache::RedisCacheStore.new(url: ENV["REDIS_URL"])
else
  ActiveSupport::Cache::MemoryStore.new
end

Rack::Attack.throttle("auth/login", limit: 10, period: 60) do |req|
  req.ip if req.path == "/auth/login" && req.post?
end

Rack::Attack.throttle("auth/signup", limit: 10, period: 60) do |req|
  req.ip if req.path == "/auth/signup" && req.post?
end

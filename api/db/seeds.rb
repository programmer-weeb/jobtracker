abort("Refusing to seed in production. Use ALLOW_DEMO_SEED=1 rails demo:seed for the public demo dataset.") if Rails.env.production?

require Rails.root.join("db/demo_seed").to_s

DemoSeed.run

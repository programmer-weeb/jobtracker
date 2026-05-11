namespace :demo do
  desc "Seed deterministic demo users and data. Requires ALLOW_DEMO_SEED=1 in production."
  task seed: :environment do
    if Rails.env.production? && ENV["ALLOW_DEMO_SEED"] != "1"
      abort("Refusing to seed demo data in production without ALLOW_DEMO_SEED=1")
    end

    require Rails.root.join("db/demo_seed").to_s

    DemoSeed.run
  end
end

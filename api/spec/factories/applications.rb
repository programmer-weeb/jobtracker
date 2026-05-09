FactoryBot.define do
  factory :application do
    user
    company { association(:company, user: user) }

    title { "Backend Engineer" }
    status { :applied }
    source { "LinkedIn" }
    salary_min { 3000 }
    salary_max { 5000 }
    currency { "USD" }
    remote { true }
    location { "Remote" }
    url { "https://jobs.example.com/posting" }
    applied_at { Time.current }
    sequence(:position)
  end
end

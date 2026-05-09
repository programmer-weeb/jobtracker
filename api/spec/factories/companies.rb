FactoryBot.define do
  factory :company do
    association :user
    sequence(:name) { |n| "Company #{n}" }
    website { "https://example.com" }
    location { "Cairo" }
    notes { "Good culture" }
  end
end

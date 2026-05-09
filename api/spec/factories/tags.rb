FactoryBot.define do
  factory :tag do
    association :user
    sequence(:name) { |n| "Tag #{n}" }
    color { "#22c55e" }
  end
end

FactoryBot.define do
  factory :note do
    association :application
    body { "Follow up next week" }
  end
end

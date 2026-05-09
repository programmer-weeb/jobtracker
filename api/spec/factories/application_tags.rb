FactoryBot.define do
  factory :application_tag do
    association :application
    tag { association(:tag, user: application.user) }
  end
end

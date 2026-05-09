FactoryBot.define do
  factory :event do
    association :application
    kind { :status_changed }
    payload { { from: "wishlist", to: "applied" } }
  end
end

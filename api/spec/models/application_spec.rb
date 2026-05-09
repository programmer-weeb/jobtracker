require "rails_helper"

RSpec.describe Application, type: :model do
  subject(:application) { build(:application) }

  describe "associations" do
    it { is_expected.to belong_to(:user) }
    it { is_expected.to belong_to(:company) }
    it { is_expected.to have_many(:events).dependent(:destroy) }
    it { is_expected.to have_many(:notes).dependent(:destroy) }
    it { is_expected.to have_many(:application_tags).dependent(:destroy) }
    it { is_expected.to have_many(:tags).through(:application_tags) }
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:title) }
  end

  describe "enums" do
    it do
      expect(application).to define_enum_for(:status)
        .with_values(wishlist: 0, applied: 1, interview: 2, offer: 3, rejected: 4, archived: 5)
    end
  end
end

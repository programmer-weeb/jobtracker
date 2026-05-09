require "rails_helper"

RSpec.describe Tag, type: :model do
  subject(:tag) { build(:tag) }

  describe "associations" do
    it { is_expected.to belong_to(:user) }
    it { is_expected.to have_many(:application_tags).dependent(:destroy) }
    it { is_expected.to have_many(:applications).through(:application_tags) }
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_uniqueness_of(:name).scoped_to(:user_id) }
    it { is_expected.to validate_presence_of(:color) }
  end
end

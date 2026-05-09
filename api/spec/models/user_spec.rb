require "rails_helper"

RSpec.describe User, type: :model do
  subject(:user) { build(:user) }

  describe "associations" do
    it { is_expected.to have_many(:companies).dependent(:destroy) }
    it { is_expected.to have_many(:applications).dependent(:destroy) }
    it { is_expected.to have_many(:tags).dependent(:destroy) }
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_presence_of(:email) }
  end
end

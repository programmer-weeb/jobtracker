require "rails_helper"

RSpec.describe Event, type: :model do
  subject(:event) { build(:event) }

  describe "associations" do
    it { is_expected.to belong_to(:application) }
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:payload) }
  end

  describe "enums" do
    it do
      expect(event).to define_enum_for(:kind)
        .with_values(status_changed: 0, note_added: 1, reminder_sent: 2)
    end
  end
end

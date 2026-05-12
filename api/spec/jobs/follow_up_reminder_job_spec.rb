require "rails_helper"

RSpec.describe FollowUpReminderJob, type: :job do
  describe "#perform" do
    it "records a reminder event for an active application" do
      application = create(:application, status: :applied)

      expect {
        described_class.perform_now(application)
      }.to change { application.events.reminder_sent.count }.by(1)

      event = application.events.reminder_sent.last
      expect(event.payload).to include(
        "application_id" => application.id,
        "message" => "Follow up reminder"
      )
    end

    it "does nothing for rejected applications" do
      application = create(:application, status: :rejected)

      expect {
        described_class.perform_now(application)
      }.not_to change { application.events.count }
    end

    it "does nothing for archived applications" do
      application = create(:application, status: :archived)

      expect {
        described_class.perform_now(application)
      }.not_to change { application.events.count }
    end
  end
end

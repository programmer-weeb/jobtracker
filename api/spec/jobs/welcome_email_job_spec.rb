require "rails_helper"

RSpec.describe WelcomeEmailJob, type: :job do
  describe "#perform" do
    it "sends a welcome email to the user" do
      user = create(:user, email: "welcome@example.com", name: "Welcome User")
      clear_enqueued_jobs

      expect {
        described_class.perform_now(user)
      }.to change { ActionMailer::Base.deliveries.count }.by(1)

      email = ActionMailer::Base.deliveries.last
      expect(email.to).to eq(["welcome@example.com"])
      expect(email.subject).to eq("Welcome to Jobtracker")
      expect(email.body.encoded).to include("Welcome User")
    end
  end
end

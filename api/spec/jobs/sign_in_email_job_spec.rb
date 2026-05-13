require "rails_helper"

RSpec.describe SignInEmailJob, type: :job do
  describe "#perform" do
    it "sends a sign-in email to the user" do
      user = create(:user, email: "signin@example.com", name: "Signed In User")
      clear_enqueued_jobs

      expect {
        described_class.perform_now(user)
      }.to change { ActionMailer::Base.deliveries.count }.by(1)

      email = ActionMailer::Base.deliveries.last
      expect(email.to).to eq(["signin@example.com"])
      expect(email.subject).to eq("New sign-in to your Jobtracker account")
      expect(email.body.encoded).to include("Signed In User")
    end
  end
end

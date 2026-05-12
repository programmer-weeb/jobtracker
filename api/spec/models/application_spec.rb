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

  describe "stamp_applied_at callback" do
    it "sets applied_at when transitioning to applied status" do
      application = build(:application, status: :wishlist, applied_at: nil)

      application.status = :applied
      application.save!

      expect(application.applied_at).to be_present
    end

    it "does not overwrite applied_at if already set" do
      existing_time = 1.day.ago
      application = create(:application, status: :wishlist, applied_at: existing_time)

      application.update!(status: :applied)

      expect(application.reload.applied_at.to_i).to eq(existing_time.to_i)
    end

    it "does not set applied_at on non-applied status changes" do
      application = create(:application, status: :wishlist)
      application.update_column(:applied_at, nil)

      application.update!(status: :rejected)

      expect(application.reload.applied_at).to be_nil
    end

    it "does not set applied_at if status doesn't change to applied" do
      application = build(:application, status: :wishlist)
      application.applied_at = nil
      application.save!

      application.update!(title: "Updated")

      expect(application.reload.applied_at).to be_nil
    end
  end

  describe "follow-up reminder callback" do
    it "schedules a follow-up reminder when created as applied" do
      expect {
        create(:application, status: :applied)
      }.to have_enqueued_job(FollowUpReminderJob)

      job = enqueued_jobs.find { |enqueued_job| enqueued_job[:job] == FollowUpReminderJob }
      expect(job[:at]).to be_within(1.second).of(7.days.from_now.to_f)
    end

    it "schedules a follow-up reminder when status changes to applied" do
      application = create(:application, status: :wishlist)
      clear_enqueued_jobs

      expect {
        application.update!(status: :applied)
      }.to have_enqueued_job(FollowUpReminderJob).with(application)
    end

    it "does not schedule a follow-up reminder for other status changes" do
      application = create(:application, status: :wishlist)
      clear_enqueued_jobs

      expect {
        application.update!(status: :interview)
      }.not_to have_enqueued_job(FollowUpReminderJob)
    end
  end
end

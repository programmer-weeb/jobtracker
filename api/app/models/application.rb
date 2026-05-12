class Application < ApplicationRecord
  FOLLOW_UP_REMINDER_DELAY = 7.days

  belongs_to :user
  belongs_to :company

  has_many :events, dependent: :destroy
  has_many :notes, dependent: :destroy
  has_many :application_tags, dependent: :destroy
  has_many :tags, through: :application_tags

  enum :status, {
    wishlist: 0,
    applied: 1,
    interview: 2,
    offer: 3,
    rejected: 4,
    archived: 5
  }, default: :wishlist

  validates :title, presence: true

  before_save :stamp_applied_at
  after_commit :schedule_follow_up_reminder, on: %i[create update], if: :should_schedule_follow_up_reminder?

  private

  def stamp_applied_at
    return if applied_at.present?
    return unless status == "applied" && status_changed?

    self.applied_at = Time.current
  end

  def should_schedule_follow_up_reminder?
    applied? && saved_change_to_status?
  end

  def schedule_follow_up_reminder
    FollowUpReminderJob.set(wait: FOLLOW_UP_REMINDER_DELAY).perform_later(self)
  end
end

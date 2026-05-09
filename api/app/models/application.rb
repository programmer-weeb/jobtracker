class Application < ApplicationRecord
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

  private

  def stamp_applied_at
    return if applied_at.present?
    return unless status == "applied" && status_changed?

    self.applied_at = Time.current
  end
end
